// Downloads every remote image the site references into public/images/remote,
// so pages serve them from this site instead of hotlinking (hotlinks get
// blocked, rate-limited or deleted). Runs before `astro build`; run it by hand
// with `npm run images` and commit the folder to pin the files for good.
//
// Pages call imageUrl() (src/lib/images.ts), which falls back to the original
// URL for anything that couldn't be fetched.

import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const SOURCES = ["src/content", "src/data"];
const OUT = path.join(root, "public/images/remote");
const MANIFEST = path.join(OUT, "manifest.json");

const EXTENSIONS = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/avif": "avif",
    "image/svg+xml": "svg",
};

async function filesUnder(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
    const nested = await Promise.all(
        entries.map((entry) => {
            const full = path.join(dir, entry.name);
            return entry.isDirectory() ? filesUnder(full) : [full];
        }),
    );
    return nested.flat();
}

/** Image URLs written as `src:` or `fallback:` in content and data files. */
async function findImageUrls() {
    const urls = new Set();
    for (const dir of SOURCES) {
        for (const file of await filesUnder(path.join(root, dir))) {
            if (!/\.(md|mdx|ts|js|json)$/.test(file)) continue;
            const text = await fs.readFile(file, "utf8");
            for (const match of text.matchAll(/\b(?:src|fallback):\s*["'`]?(https?:\/\/[^"'`\s]+)/g)) {
                urls.add(match[1]);
            }
        }
    }
    return [...urls];
}

async function download(url) {
    const response = await fetch(url, {
        headers: {
            // Wikimedia asks scripted clients to say who they are.
            "User-Agent": "pujitm.xyz site build (https://pujitm.xyz)",
            // Tumblr serves an HTML page unless asked for an image.
            Accept: "image/avif,image/webp,image/png,image/jpeg,image/*;q=0.8",
        },
        redirect: "follow",
        signal: AbortSignal.timeout(20_000),
    });
    const type = (response.headers.get("content-type") ?? "").split(";")[0].trim();
    if (!response.ok || !EXTENSIONS[type]) {
        throw new Error(`${response.status} ${type || "no content-type"}`);
    }
    const name = `${createHash("sha1").update(url).digest("hex").slice(0, 16)}.${EXTENSIONS[type]}`;
    await fs.writeFile(path.join(OUT, name), Buffer.from(await response.arrayBuffer()));
    return name;
}

export async function selfHostImages(log = console) {
    await fs.mkdir(OUT, { recursive: true });
    const manifest = existsSync(MANIFEST)
        ? JSON.parse(await fs.readFile(MANIFEST, "utf8"))
        : {};
    const urls = await findImageUrls();
    const missing = urls.filter(
        (url) => !manifest[url] || !existsSync(path.join(OUT, manifest[url])),
    );
    let fetched = 0;
    await Promise.all(
        missing.map(async (url) => {
            try {
                manifest[url] = await download(url);
                fetched++;
            } catch (error) {
                delete manifest[url];
                log.warn(`couldn't self-host ${url} (${error.message}); it will be hotlinked`);
            }
        }),
    );
    await fs.writeFile(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
    log.info(`${urls.length - missing.length + fetched}/${urls.length} images self-hosted`);
}

/** Astro integration: fetch before building. */
export default function selfHostImagesIntegration() {
    return {
        name: "self-host-images",
        hooks: {
            "astro:config:setup": async ({ command, logger }) => {
                if (command === "build") await selfHostImages(logger);
            },
        },
    };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    await selfHostImages();
}
