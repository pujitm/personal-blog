// Layout for the collage: a scattered state the Hidden Leaf is cut through,
// and an orderly board everything settles into. Units are a 1000-wide world.

import { readFileSync } from "node:fs";
import path from "node:path";
import { insigniaSources } from "../data/insignia";

export type Form = "image" | "wide" | "cover" | "card" | "square" | "scrap";

export function rng(seed: number) {
    let s = seed >>> 0;
    return () => {
        s = (s + 0x6d2b79f5) >>> 0;
        let t = s;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/** Width and height while scattered, by form. */
const SIZE: Record<Exclude<Form, "scrap">, [number, number]> = {
    image: [200, 150],
    wide: [270, 96],
    cover: [104, 156],
    card: [168, 110],
    square: [118, 118],
};

export interface Scattered {
    x: number;
    y: number;
    w: number;
    h: number;
    /** Degrees, small enough to read without tilting your head. */
    rot: number;
    z: number;
}

/**
 * Scatters things over the canvas: each lands where it covers the most empty
 * space, overlapping its neighbors a little. Paper scraps then fill what's
 * left uncovered.
 */
export function scatter<T extends { form: Form; aspect?: number; featured?: boolean }>(things: T[]) {
    const random = rng(1951);
    const between = (lo: number, hi: number) => lo + (hi - lo) * random();
    const placed: { thing: T; at: Scattered }[] = [];

    const overlap = (a: Scattered, b: Scattered) =>
        Math.max(0, Math.min(a.x + a.w / 2, b.x + b.w / 2) - Math.max(a.x - a.w / 2, b.x - b.w / 2)) *
        Math.max(0, Math.min(a.y + a.h / 2, b.y + b.h / 2) - Math.max(a.y - a.h / 2, b.y - b.h / 2));

    // Biggest first, so small things tuck in around them.
    const sized = things
        .map((thing) => {
            let [w, h] = SIZE[thing.form as Exclude<Form, "scrap">];
            if (thing.form === "image" && thing.aspect) {
                const area = w * h;
                w = Math.sqrt(area * thing.aspect);
                h = area / w;
            }
            const grow = thing.featured ? 1.3 : 1;
            return { thing, w: w * grow, h: h * grow };
        })
        .sort((a, b) => b.w * b.h - a.w * a.h);

    let z = 20;
    for (const { thing, w, h } of sized) {
        let best: Scattered | undefined;
        let bestCost = Infinity;
        for (let tries = 0; tries < 60; tries++) {
            const at = {
                x: between(w * 0.35, 1000 - w * 0.35),
                y: between(h * 0.35, 1000 - h * 0.35),
                w,
                h,
                rot: 0,
                z: 0,
            };
            const cost = placed.reduce((sum, p) => sum + overlap(at, p.at), 0);
            if (cost < bestCost) {
                bestCost = cost;
                best = at;
            }
        }
        best!.rot = between(-11, 11);
        best!.z = z++;
        placed.push({ thing, at: best! });
    }

    // Fill the gaps with scraps, underneath.
    const covered = (x: number, y: number) =>
        placed.some(({ at }) => Math.abs(x - at.x) < at.w * 0.45 && Math.abs(y - at.y) < at.h * 0.45);
    const scraps: Scattered[] = [];
    for (let y = 20; y < 1000; y += 46) {
        for (let x = 20; x < 1000; x += 46) {
            const px = x + between(-14, 14);
            const py = y + between(-14, 14);
            if (covered(px, py) || scraps.some((s) => Math.abs(s.x - px) < s.w * 0.4 && Math.abs(s.y - py) < s.h * 0.4)) continue;
            scraps.push({ x: px, y: py, w: between(70, 140), h: between(55, 120), rot: between(-14, 14), z: Math.floor(between(1, 19)) });
        }
    }

    return { things: placed, scraps };
}

export interface Settled {
    x: number;
    y: number;
    /** Uniform scale from the scattered size to the column width. */
    scale: number;
}

/**
 * Masonry board: each thing drops into the shortest column (wide things span
 * two), scaled to fit. Returns positions in the input order and the height.
 */
export function board(sizes: { w: number; h: number; wide: boolean }[], columns: number, gap: number) {
    const col = (1000 - gap * (columns + 1)) / columns;
    const heights: number[] = Array(columns).fill(gap);
    const settled = sizes.map(({ w, h, wide }): Settled => {
        const span = wide ? Math.min(2, columns) : 1;
        let start = 0;
        let lowest = Infinity;
        for (let c = 0; c + span <= columns; c++) {
            const level = Math.max(...heights.slice(c, c + span));
            if (level < lowest - 0.5) {
                lowest = level;
                start = c;
            }
        }
        const width = col * span + gap * (span - 1);
        const scale = width / w;
        const height = h * scale;
        for (let c = start; c < start + span; c++) heights[c] = lowest + height + gap;
        return { x: gap + start * (col + gap) + width / 2, y: lowest + height / 2, scale };
    });
    return { settled, height: Math.max(...heights) };
}

/**
 * The Hidden Leaf as a CSS mask, drawn from the reference SVG the workflow
 * downloaded (thickened a little so it reads through the collage).
 */
export function insigniaMask(): string | undefined {
    const dir = path.join(process.cwd(), "public/images/remote");
    try {
        const manifest = JSON.parse(readFileSync(path.join(dir, "manifest.json"), "utf8"));
        for (const { src } of insigniaSources) {
            if (!manifest[src]) continue;
            const svg = readFileSync(path.join(dir, manifest[src]), "utf8");
            const paths = [...svg.matchAll(/<path[^>]* d="([^"]+)"/g)].map((m) => m[1]);
            if (!paths.length || !/viewBox="0 0 72 72"/.test(svg)) continue;
            const mask =
                `<svg xmlns="http://www.w3.org/2000/svg" viewBox="5.4 5 62 62">` +
                paths
                    .map(
                        (d) =>
                            `<path d="${d}" fill="none" stroke="#000" stroke-width="5.8" stroke-linecap="round" stroke-linejoin="round"/>`,
                    )
                    .join("") +
                `</svg>`;
            return `url("data:image/svg+xml,${encodeURIComponent(mask)}")`;
        }
    } catch {
        // No reference drawing yet; the collage just isn't sliced.
    }
    return undefined;
}
