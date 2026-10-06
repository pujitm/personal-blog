// Builds the Hidden Leaf out of the things themselves, in their own colors,
// then lays out the board they settle into. Units are world pixels.
//
// The symbol is traced from the reference drawing the workflow downloaded
// (two strokes: the spiral running out into the stem, and the leaf). The
// things run along it theme after theme, either
//   blended   as one line, each theme running into the next: down the stem
//             and over the top, round the leaf, back along the turn of the
//             spiral inside it, and curling in to the eye; or
//   separate  each theme its own part: the heroic-moral the leaf, the
//             tragic-psychological the outer arc and stem, the
//             romantic-spiritual the curl in to the eye.
// Pieces stay upright and are sized so the line keeps one weight throughout.

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
    theme: string;
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
/** How many of the next things the walk considers for each spot. */
const LOOKAHEAD = 6;

/** A stroke in world pixels, with what's needed to find a spot along it. */
function line(pts: Point[]) {
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
    return { L, at };
}

type Line = ReturnType<typeof line>;

/**
 * Walks the things, in order, along the strokes at a stroke width of `T`,
 * moving on to the next stroke when one is full. Each piece stays upright
 * and is sized so it spans the stroke exactly (by its height where the curve
 * runs flat, its width where it runs steep), and of the next few the walk
 * takes whichever shape suits the curve there, so nothing ends up tiny or
 * overlong. Returns where each lands, and whether all fit.
 */
function walk(things: Thing[], lines: Line[], T: number) {
    const sized = (thing: Thing, angle: number) => {
        const c = Math.abs(Math.cos(angle));
        const s = Math.abs(Math.sin(angle));
        const scale = T / (thing.w * s + thing.h * c);
        return { scale, along: (thing.w * c + thing.h * s) * scale };
    };

    const queue = [...things];
    const placed: { thing: Thing; stroke: number; distance: number; along: number }[] = [];
    let stroke = 0;
    let distance = 0;
    let previous = 0;
    while (queue.length) {
        const here = lines[stroke];
        const angle = here.at(distance + T * 0.5).angle;
        const misfit = (thing: Thing) => Math.abs(Math.log(sized(thing, angle).along / (T * 1.35)));
        const next = queue.slice(0, LOOKAHEAD).reduce((best, thing) => (misfit(thing) < misfit(best) - 0.2 ? thing : best));
        const { along } = sized(next, angle);
        const step = previous ? ((previous + along) / 2) * OVERLAP : along * 0.4;
        // A piece may hang a little past the end of a stroke (they meet
        // other strokes there) rather than leave a gap.
        if (distance + step + along * 0.1 > here.L && stroke < lines.length - 1) {
            stroke++;
            distance = 0;
            previous = 0;
            continue;
        }
        queue.splice(queue.indexOf(next), 1);
        distance += step;
        previous = along;
        placed.push({ thing: next, stroke, distance, along });
    }
    const fits = stroke < lines.length - 1 || distance + previous * 0.4 <= lines[stroke].L;
    return { placed, fits, sized };
}

/** The widest stroke at which a part's things all fit along it. */
function widest(things: Thing[], lines: Line[]) {
    let lo = 20;
    let hi = 400;
    for (let i = 0; i < 28; i++) {
        const mid = (lo + hi) / 2;
        if (walk(things, lines, mid).fits) lo = mid;
        else hi = mid;
    }
    return lo;
}

/**
 * Lays each part's things along its strokes, each as wide as it can be but
 * no more than a little wider than the narrowest part (so the line keeps
 * about one weight), then spaces each stroke's pieces out to reach its end.
 */
function fill(parts: { things: Thing[]; lines: Line[] }[], random: () => number) {
    const widths = parts.map((part) => (part.things.length ? widest(part.things, part.lines) : 0));
    const narrowest = Math.min(...widths.filter(Boolean));
    const out = new Map<string, Formed>();
    const T = widths.map((w) => Math.min(w, narrowest * 1.18));
    parts.forEach((part, k) => {
        if (!part.things.length) return;
        const { placed, sized } = walk(part.things, part.lines, T[k]);
        part.lines.forEach((here, s) => {
            const mine = placed.filter((p) => p.stroke === s);
            if (!mine.length) return;
            const last = mine[mine.length - 1];
            const stretch = Math.max(1, here.L / (last.distance + last.along * 0.4));
            for (const { thing, distance } of mine) {
                const p = here.at(distance * stretch);
                const { scale } = sized(thing, p.angle);
                const normal = p.angle + Math.PI / 2;
                const drift = (random() - 0.5) * T[k] * 0.12;
                out.set(thing.id, {
                    x: p.x + Math.cos(normal) * drift,
                    y: p.y + Math.sin(normal) * drift,
                    w: thing.w * scale,
                    h: thing.h * scale,
                    rot: (random() - 0.5) * 7,
                    z: 0,
                });
            }
        });
    });
    return { formed: out };
}

/**
 * Forms the symbol from the things, in order (the last one sits at the eye).
 * Returns where each sits and the size of the world they span, or nothing if
 * the reference drawing isn't available.
 */
export function formSymbol(things: Thing[], layout: "blend" | "separate") {
    const traced = strokes();
    if (!traced || things.length < 2) return undefined;
    const [spiral, leaf] = traced;
    const eye = things[things.length - 1];
    const along = things.slice(0, -1);

    // Distances along the spiral stroke (reference units): it curls in the
    // middle (0-9), turns, and runs out into the stem (to ~155). The leaf
    // leaves the spiral at 102 and rejoins it at 69. Ends are trimmed where
    // strokes meet.
    const leafLength = lengths(leaf).at(-1)!;
    const stem = cut(spiral, 101.5, 999); // from 102 over the top and out
    const outline = cut(leaf, 2, leafLength - 3.5); // from 102 round the tip to 69
    const inside = cut(spiral, 72, 100); // the turn inside the leaf, 69 to 102
    const curl = cut(spiral, 9, 66).reverse(); // from 69 in to the eye

    const parts =
        layout === "blend"
            ? // One line: down the stem and over the top, round the leaf,
              // then (the one jump, 69 back up to 102) down the turn inside
              // it and in to the eye.
              [{ things: along, lines: [[...stem].reverse(), outline, [...inside].reverse(), curl].map(line) }]
            : [...new Set(along.map((thing) => thing.theme))].map((theme, k) => ({
                  things: along.filter((thing) => thing.theme === theme),
                  lines: [[outline, inside], [stem], [curl]][Math.min(k, 2)].map(line),
              }));

    const { formed } = fill(parts, rng(1));
    let z = 10;
    for (const thing of along) formed.get(thing.id)!.z = z++;
    const center = cut(spiral, 0, 9);
    const cx = (center.reduce((s, p) => s + p.x, 0) / center.length) * SCALE;
    const cy = (center.reduce((s, p) => s + p.y, 0) / center.length) * SCALE;
    formed.set(eye.id, { x: cx, y: cy, w: eye.w * 1.5, h: eye.h * 1.5, rot: -2, z: z++ });

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
 * shortest column (wide things span two), scaled to fit. Each of `breaks`
 * starts a new band, a little below the last.
 */
export function board(
    sizes: { w: number; h: number; wide: boolean }[],
    width: number,
    columns: number,
    gap: number,
    breaks: number[] = [],
) {
    const col = (width - gap * (columns + 1)) / columns;
    const heights: number[] = Array(columns).fill(gap);
    const settled = sizes.map(({ w, h, wide }, i): Settled => {
        if (i > 0 && breaks.includes(i)) heights.fill(Math.max(...heights) + gap * 3);
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
