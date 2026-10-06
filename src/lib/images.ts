import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

// Written by integrations/self-host-images.mjs (or the Self-host images
// workflow) into public/images/remote.
const DIR = path.join(process.cwd(), "public/images/remote");

let manifest: Record<string, string> | undefined;

const local = (src: string) => {
    if (!manifest) {
        try {
            manifest = JSON.parse(readFileSync(path.join(DIR, "manifest.json"), "utf8"));
        } catch {
            manifest = {};
        }
    }
    const file = manifest![src];
    return file && existsSync(path.join(DIR, file)) ? file : undefined;
};

/**
 * The self-hosted copy of a remote image when there is one (or of its
 * fallback, when only that one could be fetched), else the original.
 */
export function imageUrl(src: string, fallback?: string): string {
    if (!/^https?:/.test(src)) return src;
    const file = local(src) ?? (fallback ? local(fallback) : undefined);
    return file ? `/images/remote/${file}` : src;
}

/** Shape, dominant color, and whether it's a cut-out, for a self-hosted image. */
export async function imageInfo(
    src: string,
    fallback?: string,
): Promise<{ aspect?: number; alpha?: boolean; color?: [number, number, number] }> {
    const file = local(src) ?? (fallback ? local(fallback) : undefined);
    if (!file) return {};
    try {
        const { default: sharp } = await import("sharp");
        const image = sharp(path.join(DIR, file));
        const { width, height, hasAlpha } = await image.metadata();
        const { dominant } = await image.stats();
        return {
            aspect: width && height ? width / height : undefined,
            alpha: hasAlpha,
            color: [dominant.r, dominant.g, dominant.b],
        };
    } catch {
        return {};
    }
}
