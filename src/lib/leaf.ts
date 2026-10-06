// Builds the Hidden Leaf out of the things themselves, in their own colors,
// then lays out the board they settle into. Units are world pixels.
//
// The symbol is traced from the reference drawing the workflow downloaded
// (two strokes: the spiral running out into the stem, and the leaf). Each
// part of the symbol gets its own material:
//   eye     one picture where the spiral curls in
//   heart   the inner turn: sticky notes and index cards
//   outer   the outer turn and stem: pictures in color order, sheet music
//           wherever the curve runs flat
//   leaf    every book, standing up, in color order: the base is a shelf
// Pieces stay upright and are sized so each part is filled end to end.

import { readFileSync } from "node:fs";
import path from "node:path";
import { insigniaSources } from "../data/insignia";

export type Form = "image" | "wide" | "cover" | "card" | "square";

interface Point {
    x: number;
    y: number;
}

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

// ---------------------------------------------------------------- the symbol

/** Samples an SVG path made of absolute M, L and C commands. */
function sample(d: string, step = 0.1): Point[] {
    const tokens = d.match(/[MCL]|-?\d*\.?\d+(?:e-?\d+)?/g) ?? [];
    const pts: Point[] = [];
    let i = 0;
    let cmd = "";
    let cur: Point = { x: 0, y: 0 };
    const num = () => Number(tokens[i++]);
    while (i < tokens.length) {
        if (/[MCL]/.test(tokens[i])) cmd = tokens[i++];
        if (cmd === "M") {
            cur = { x: num(), y: num() };
            pts.push(cur);
            cmd = "L";
        } else if (cmd === "L") {
            const p = { x: num(), y: num() };
            const n = Math.max(1, Math.ceil(Math.hypot(p.x - cur.x, p.y - cur.y) / step));
            for (let k = 1; k <= n; k++) pts.push({ x: cur.x + ((p.x - cur.x) * k) / n, y: cur.y + ((p.y - cur.y) * k) / n });
            cur = p;
        } else if (cmd === "C") {
            const c1 = { x: num(), y: num() };
            const c2 = { x: num(), y: num() };
            const p = { x: num(), y: num() };
            const rough = Math.hypot(c1.x - cur.x, c1.y - cur.y) + Math.hypot(c2.x - c1.x, c2.y - c1.y) + Math.hypot(p.x - c2.x, p.y - c2.y);
            const n = Math.max(2, Math.ceil(rough / step));
            for (let k = 1; k <= n; k++) {
                const t = k / n;
                const u = 1 - t;
                pts.push({
                    x: u * u * u * cur.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * p.x,
                    y: u * u * u * cur.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * p.y,
                });
            }
            cur = p;
        } else {
            i++;
        }
    }
    return pts;
}

const lengths = (pts: Point[]) =>
    pts.reduce<number[]>((acc, p, j) => (j ? [...acc, acc[j - 1] + Math.hypot(p.x - pts[j - 1].x, p.y - pts[j - 1].y)] : [0]), []);

/** The part of a stroke between two distances along it. */
function cut(pts: Point[], from: number, to: number) {
    const cum = lengths(pts);
    return pts.filter((_, j) => cum[j] >= from && cum[j] <= to);
}

/** The two strokes of the reference drawing, or nothing if it isn't downloaded yet. */
function strokes(): [Point[], Point[]] | undefined {
    const dir = path.join(process.cwd(), "public/images/remote");
    try {
        const manifest = JSON.parse(readFileSync(path.join(dir, "manifest.json"), "utf8"));
        for (const { src } of insigniaSources) {
            if (!manifest[src]) continue;
            const svg = readFileSync(path.join(dir, manifest[src]), "utf8");
            const paths = [...svg.matchAll(/<path[^>]* d="([^"]+)"/g)].map((m) => m[1]);
            if (paths.length === 2 && /viewBox="0 0 72 72"/.test(svg)) {
                const [spiral, leaf] = paths.map((d) => sample(d));
                return [spiral, leaf];
            }
        }
    } catch {
        // Fall through.
    }
    return undefined;
}

// ---------------------------------------------------------------- the pieces

export interface Thing {
    id: string;
    form: Form;
    /** Base width and height before fitting. */
    w: number;
    h: number;
    /** 0-360 for colors; neutrals sort after, by lightness. */
    hue: number;
    role: "eye" | "note" | "picture" | "music" | "book";
}

export interface Formed {
    x: number;
    y: number;
    w: number;
    h: number;
    rot: number;
    z: number;
}

const SCALE = 24; // reference units to world pixels
const OVERLAP = 0.6;

/**
 * Walks pieces along one part of the symbol at a stroke width of `T`. Each
 * piece stays upright and is sized so it spans the stroke exactly (by its
 * height where the curve runs flat, its width where it runs steep), and of
 * the next few in line the walk takes whichever shape suits the curve there,
 * so nothing ends up tiny or overlong.
 */
function walk(things: Thing[], pts: Point[], T: number, random: () => number) {
    const P = pts.map((p) => ({ x: p.x * SCALE, y: p.y * SCALE }));
    const cum = lengths(P);
    const L = cum[cum.length - 1];
    const at = (distance: number) => {
        const d = Math.max(0, Math.min(L, distance));
        let j = cum.findIndex((c) => c >= d);
        if (j < 1) j = 1;
        const t = (d - cum[j - 1]) / (cum[j] - cum[j - 1] || 1);
        const a0 = Math.max(0, j - 25);
        const a1 = Math.min(P.length - 1, j + 25);
        return {
            x: P[j - 1].x + (P[j].x - P[j - 1].x) * t,
            y: P[j - 1].y + (P[j].y - P[j - 1].y) * t,
            angle: Math.atan2(P[a1].y - P[a0].y, P[a1].x - P[a0].x),
        };
    };
    const sized = (thing: Thing, angle: number) => {
        const c = Math.abs(Math.cos(angle));
        const s = Math.abs(Math.sin(angle));
        const scale = T / (thing.w * s + thing.h * c);
        return { scale, along: (thing.w * c + thing.h * s) * scale };
    };

    const queue = [...things];
    const laid: { thing: Thing; at: Formed }[] = [];
    let distance = 0;
    let previous = 0;
    while (queue.length) {
        const angle = at(distance + T * 0.5).angle;
        const misfit = (thing: Thing) => Math.abs(Math.log(sized(thing, angle).along / (T * 1.35)));
        const next = queue.slice(0, 4).reduce((best, thing) => (misfit(thing) < misfit(best) - 0.2 ? thing : best));
        queue.splice(queue.indexOf(next), 1);
        const { along } = sized(next, angle);
        distance += previous ? ((previous + along) / 2) * OVERLAP : along * 0.4;
        previous = along;
        const p = at(distance);
        const { scale } = sized(next, p.angle);
        const normal = p.angle + Math.PI / 2;
        const drift = (random() - 0.5) * T * 0.12;
        laid.push({
            thing: next,
            at: {
                x: p.x + Math.cos(normal) * drift,
                y: p.y + Math.sin(normal) * drift,
                w: next.w * scale,
                h: next.h * scale,
                rot: (random() - 0.5) * 7,
                z: 0,
            },
        });
    }
    return { laid, used: distance + previous * 0.4, length: L };
}

/** Finds the stroke width at which one part's pieces fill it exactly. */
function fill(things: Thing[], pts: Point[], seed: number) {
    let lo = 20;
    let hi = 400;
    for (let i = 0; i < 28; i++) {
        const mid = (lo + hi) / 2;
        const { used, length } = walk(things, pts, mid, rng(seed));
        if (used > length) hi = mid;
        else lo = mid;
    }
    return walk(things, pts, lo, rng(seed)).laid;
}

const byHue = (things: Thing[]) => [...things].sort((a, b) => a.hue - b.hue);

/**
 * Forms the symbol. Returns where each thing sits and the size of the world
 * it spans, or nothing if the reference drawing isn't available.
 */
export function formSymbol(things: Thing[]) {
    const traced = strokes();
    if (!traced) return undefined;
    const [spiral, leaf] = traced;

    const eye = things.find((t) => t.role === "eye");
    const pictures = byHue(things.filter((t) => t.role === "picture"));
    const music = things.filter((t) => t.role === "music");
    const notes = things.filter((t) => t.role === "note");
    const books = byHue(things.filter((t) => t.role === "book"));

    // One line from the tip of the stem around the spiral and in: pictures
    // in color order, with notes and sheet music spread evenly through them.
    // The curve picks which of the next few suits it, so shapes mix in.
    const spread = (base: Thing[], extra: Thing[]) => {
        const out = [...base];
        extra.forEach((thing, i) => out.splice(Math.round(((i + 0.5) * out.length) / extra.length) + 0, 0, thing));
        return out;
    };
    const line = spread(spread(pictures, notes), music);

    // Distances along the spiral stroke (reference units): it curls in the
    // middle (0-9), then turns twice and runs out into the stem. The leaf
    // joins the spiral at both ends, so trim those.
    const leafLength = lengths(leaf).at(-1)!;
    const parts = [
        { things: line, pts: cut(spiral, 9, 999).reverse(), seed: 1 },
        { things: books, pts: cut(leaf, 4, leafLength - 3), seed: 3 },
    ];

    const formed = new Map<string, Formed>();
    let z = 10;
    for (const part of parts) {
        for (const { thing, at } of fill(part.things, part.pts, part.seed)) {
            formed.set(thing.id, { ...at, z: z++ });
        }
    }
    if (eye) {
        const curl = cut(spiral, 0, 9);
        const x = (curl.reduce((s, p) => s + p.x, 0) / curl.length) * SCALE;
        const y = (curl.reduce((s, p) => s + p.y, 0) / curl.length) * SCALE;
        formed.set(eye.id, { x, y, w: eye.w * 1.5, h: eye.h * 1.5, rot: -2, z: z++ });
    }

    // Shift everything to start at a margin from the origin.
    const all = [...formed.values()];
    const margin = 60;
    const left = Math.min(...all.map((f) => f.x - f.w / 2)) - margin;
    const top = Math.min(...all.map((f) => f.y - f.h / 2)) - margin;
    for (const f of all) {
        f.x -= left;
        f.y -= top;
    }
    const width = Math.max(...all.map((f) => f.x + f.w / 2)) + margin;
    const height = Math.max(...all.map((f) => f.y + f.h / 2)) + margin;
    return { formed, width, height };
}

// ---------------------------------------------------------------- the board

export interface Settled {
    x: number;
    y: number;
    /** Uniform scale from the formed size to the column width. */
    scale: number;
}

/**
 * Masonry board across the world's width: each thing drops into the
 * shortest column (wide things span two), scaled to fit.
 */
export function board(sizes: { w: number; h: number; wide: boolean }[], width: number, columns: number, gap: number) {
    const col = (width - gap * (columns + 1)) / columns;
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
        const span_w = col * span + gap * (span - 1);
        const scale = span_w / w;
        const height = h * scale;
        for (let c = start; c < start + span; c++) heights[c] = lowest + height + gap;
        return { x: gap + start * (col + gap) + span_w / 2, y: lowest + height / 2, scale };
    });
    return { settled, height: Math.max(...heights) };
}
