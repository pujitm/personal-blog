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

/**
 * Image URLs written as `src:` in content and data files, each with the
 * `fallback:` written right under it, if any.
 */
async function findImages() {
    const images = new Map();
    for (const dir of SOURCES) {
        for (const file of await filesUnder(path.join(root, dir))) {
            if (!/\.(md|mdx|ts|js|json)$/.test(file)) continue;
            const text = await fs.readFile(file, "utf8");
            const url = /["'`]?(https?:\/\/[^"'`\s]+)["'`]?,?/.source;
            for (const match of text.matchAll(new RegExp(`\\bsrc:\\s*${url}(?:\\s*fallback:\\s*${url})?`, "g"))) {
                images.set(match[1], match[2]);
            }
        }
    }
    return images;
}

// Anything smaller is a placeholder (Amazon answers a missing cover with a
// 1x1 GIF), not the picture.
const TOO_SMALL = 1500;

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
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length < TOO_SMALL) throw new Error(`only ${bytes.length} bytes, a placeholder`);
    const name = `${createHash("sha1").update(url).digest("hex").slice(0, 16)}.${EXTENSIONS[type]}`;
    await fs.writeFile(path.join(OUT, name), bytes);
    return name;
}

export async function selfHostImages(log = console) {
    await fs.mkdir(OUT, { recursive: true });
    const manifest = existsSync(MANIFEST)
        ? JSON.parse(await fs.readFile(MANIFEST, "utf8"))
        : {};
    const images = await findImages();
    const hosted = (url) => manifest[url] && existsSync(path.join(OUT, manifest[url]));
    const host = async (url) => {
        try {
            manifest[url] = await download(url);
            log.info(`self-hosted ${url} -> ${manifest[url]}`);
            return true;
        } catch (error) {
            delete manifest[url];
            log.warn(`couldn't self-host ${url} (${error.message})`);
            return false;
        }
    };
    // An image's fallback is only fetched when the image itself can't be.
    const results = await Promise.all(
        [...images].map(async ([src, fallback]) => {
            if (hosted(src) || (fallback && hosted(fallback))) return true;
            if (await host(src)) return true;
            if (fallback && (await host(fallback))) return true;
            log.warn(`${src} will be hotlinked`);
            return false;
        }),
    );
    await fs.writeFile(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
    log.info(`${results.filter(Boolean).length}/${images.size} images self-hosted`);
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
