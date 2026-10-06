import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

// Written by integrations/self-host-images.mjs before each build.
const DIR = path.join(process.cwd(), "public/images/remote");

let manifest: Record<string, string> | undefined;

/** The self-hosted copy of a remote image when there is one, else the original. */
export function imageUrl(src: string): string {
    if (!/^https?:/.test(src)) return src;
    if (!manifest) {
        try {
            manifest = JSON.parse(readFileSync(path.join(DIR, "manifest.json"), "utf8"));
        } catch {
            manifest = {};
        }
    }
    const file = manifest![src];
    return file && existsSync(path.join(DIR, file)) ? `/images/remote/${file}` : src;
}
