// Lays the collage out so the Hidden Leaf symbol emerges from it: pieces that
// fall on the symbol's stroke are warm and run along it, everything else is
// neutral ground. Nothing draws the symbol; it's only color and arrangement.
//
// Units are a 1000 x 1000 canvas.

export type Zone = "leaf" | "ground";

export interface Placement {
    x: number;
    y: number;
    w: number;
    h: number;
    /** Degrees. */
    rot: number;
    zone: Zone;
    z: number;
    seed: number;
}

/** What a piece is, as far as layout cares. */
export type Form = "image" | "wide" | "spine" | "cover" | "card" | "square" | "scrap";

interface Point {
    x: number;
    y: number;
}

/** Stroke width of the symbol. */
export const T = 92;

// The symbol: a spiral that runs out at the bottom, sweeps up to a point at
// the upper left, and comes back to meet the spiral.
const C = { x: 560, y: 560 };
const R0 = 26;
const R1 = 330;
const END = Math.PI / 2 + 4 * Math.PI;
const START = END - 3 * Math.PI;
const TIP = { x: 105, y: 105 };
const CONTROL = { x: 120, y: 880 };

const radius = (t: number) => R0 + ((R1 - R0) * (t - START)) / (END - START);
const spiralAt = (t: number) => ({ x: C.x + radius(t) * Math.cos(t), y: C.y + radius(t) * Math.sin(t) });
const REJOIN = spiralAt(END - (225 * Math.PI) / 180);

/** The stroke as one polyline, from the spiral's heart out to the tip and back. */
export const stroke: Point[] = (() => {
    const pts: Point[] = [];
    for (let i = 0; i <= 400; i++) pts.push(spiralAt(START + ((END - START) * i) / 400));
    const end = pts[pts.length - 1];
    for (let i = 1; i <= 120; i++) {
        const t = i / 120;
        const u = 1 - t;
        pts.push({
            x: u * u * end.x + 2 * u * t * CONTROL.x + t * t * TIP.x,
            y: u * u * end.y + 2 * u * t * CONTROL.y + t * t * TIP.y,
        });
    }
    for (let i = 1; i <= 60; i++) {
        pts.push({ x: TIP.x + ((REJOIN.x - TIP.x) * i) / 60, y: TIP.y + ((REJOIN.y - TIP.y) * i) / 60 });
    }
    return pts;
})();

const lengths = stroke.reduce<number[]>(
    (acc, p, i) => (i ? [...acc, acc[i - 1] + Math.hypot(p.x - stroke[i - 1].x, p.y - stroke[i - 1].y)] : [0]),
    [],
);
export const strokeLength = lengths[lengths.length - 1];

/** Point and direction at a distance along the stroke. */
export function along(distance: number) {
    const d = Math.max(0, Math.min(strokeLength, distance));
    let i = lengths.findIndex((l) => l >= d);
    if (i <= 0) i = 1;
    const a = stroke[i - 1];
    const b = stroke[i];
    const t = (d - lengths[i - 1]) / (lengths[i] - lengths[i - 1] || 1);
    return {
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
        angle: Math.atan2(b.y - a.y, b.x - a.x),
        /** How far from the spiral's center, for keeping the tight middle small. */
        r: Math.hypot(a.x - C.x, a.y - C.y),
    };
}

function distanceToStroke(x: number, y: number) {
    let best = Infinity;
    for (let i = 1; i < stroke.length; i += 2) {
        const a = stroke[i - 1];
        const b = stroke[i];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / (dx * dx + dy * dy || 1)));
        best = Math.min(best, Math.hypot(x - a.x - t * dx, y - a.y - t * dy));
    }
    return best;
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

/** Length along the stroke and width across it, by form. */
const LEAF_SIZE: Record<Form, [number, number]> = {
    wide: [2.3, 0.86],
    image: [1.5, 1.02],
    spine: [1.75, 0.44],
    cover: [1.05, 0.95],
    card: [1.25, 0.95],
    square: [1.0, 1.0],
    scrap: [1.1, 0.85],
};

/** Width and height on the ground, by form. */
const GROUND_SIZE: Record<Form, [number, number]> = {
    wide: [205, 78],
    image: [150, 112],
    spine: [150, 40],
    cover: [74, 110],
    card: [128, 86],
    square: [92, 92],
    scrap: [110, 90],
};

/**
 * Lays pieces down. `leaf` pieces are walked along the stroke in order,
 * overlapping like shingles, with paper scraps filling the gaps; `ground`
 * pieces and scraps fill the rest of the canvas underneath.
 *
 * `aspect` lets an image keep its shape on the ground.
 */
export function layout<T extends { form: Form; aspect?: number }>(leaf: T[], ground: T[]) {
    const random = rng(1951);
    const between = (lo: number, hi: number) => lo + (hi - lo) * random();
    const upright = (deg: number) => (deg > 90 ? deg - 180 : deg < -90 ? deg + 180 : deg);

    type Laid = { item?: T; form: Form; place: Placement };
    const laid: Laid[] = [];

    // ---- the leaf: walk the stroke, alternating things with scraps, packing
    // tighter until every thing fits.
    const walk = (overlap: number, scrapsPerItem: number) => {
        const r = rng(1951);
        const span = (lo: number, hi: number) => lo + (hi - lo) * r();
        const queue: (T | null)[] = [];
        let owed = 0;
        for (const item of leaf) {
            queue.push(item);
            owed += scrapsPerItem;
            while (owed >= 1) {
                queue.push(null);
                owed--;
            }
        }
        const out: Laid[] = [];
        let distance = T * 0.35;
        let previous = 0;
        let q = 0;
        let z = 40;
        while (distance < strokeLength - T * 0.2) {
            const here = along(distance);
            // The spiral's heart is too tight for long pieces.
            const tight = here.r < 120 && distance < strokeLength * 0.25;
            let next = queue[q] ?? null;
            if (next && tight) next = null;
            else q++;
            const form: Form = next ? next.form : "scrap";
            const [l, w] = LEAF_SIZE[form];
            const length = T * l * (next ? span(0.95, 1.05) : span(0.75, tight ? 0.95 : 1.25));
            const width = T * w * (next ? 1 : span(0.8, 1.08));
            distance += ((previous + length) / 2) * overlap;
            previous = length;
            const p = along(distance);
            const normal = p.angle + Math.PI / 2;
            const drift = span(-0.08, 0.08) * T;
            out.push({
                item: next ?? undefined,
                form,
                place: {
                    x: p.x + Math.cos(normal) * drift,
                    y: p.y + Math.sin(normal) * drift,
                    w: length,
                    h: width,
                    rot: upright((p.angle * 180) / Math.PI + span(-8, 8)),
                    zone: "leaf",
                    z: next ? z + 40 : z,
                    seed: Math.floor(r() * 1e9),
                },
            });
            z++;
        }
        return { out, leftover: queue.slice(q).filter((x): x is T => !!x) };
    };
    let attempt = walk(0.62, 0.5);
    for (let overlap = 0.58; attempt.leftover.length && overlap > 0.3; overlap -= 0.03) {
        attempt = walk(overlap, overlap > 0.45 ? 0.35 : 0);
    }
    laid.push(...attempt.out);
    const leftover = attempt.leftover;

    // A warm underlayer, so the band reads as one shape with no gaps.
    for (let d = T * 0.2; d < strokeLength; d += T * 0.42) {
        const p = along(d);
        laid.push({
            form: "scrap",
            place: {
                x: p.x,
                y: p.y,
                w: T * between(0.8, 1.05),
                h: T * between(0.86, 0.98),
                rot: upright((p.angle * 180) / Math.PI + between(-12, 12)),
                zone: "leaf",
                z: 30 + Math.floor(between(0, 9)),
                seed: Math.floor(random() * 1e9),
            },
        });
    }

    // ---- the ground: a jittered grid over the whole canvas, skipping
    // what the leaf covers. Things are spread evenly among scraps.
    const cells: Point[] = [];
    const CELL = 88;
    for (let gy = CELL / 2; gy < 1000; gy += CELL) {
        for (let gx = CELL / 2; gx < 1000; gx += CELL) {
            const x = gx + between(-0.3, 0.3) * CELL;
            const y = gy + between(-0.3, 0.3) * CELL;
            if (distanceToStroke(x, y) > T * 0.55) cells.push({ x, y });
        }
    }
    // Shuffle so things don't line up in reading order.
    for (let i = cells.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [cells[i], cells[j]] = [cells[j], cells[i]];
    }
    const things = [...leftover, ...ground];
    const every = cells.length / Math.max(1, things.length);
    let thing = 0;
    cells.forEach((cell, i) => {
        const item = i >= Math.round(thing * every) && thing < things.length ? things[thing++] : undefined;
        const form: Form = item ? item.form : "scrap";
        let [w, h] = GROUND_SIZE[form];
        if (item?.aspect && form === "image") {
            const area = w * h * 1.1;
            w = Math.sqrt(area * item.aspect);
            h = area / w;
        }
        const scale = item ? 1 : between(0.85, 1.45);
        laid.push({
            item,
            form,
            place: {
                x: cell.x,
                y: cell.y,
                w: w * scale,
                h: h * (item ? 1 : between(0.7, 1.3)),
                rot: random() < 0.12 ? between(80, 100) * (random() < 0.5 ? 1 : -1) : between(-16, 16),
                zone: "ground",
                z: item ? 20 + Math.floor(random() * 10) : 1 + Math.floor(random() * 18),
                seed: Math.floor(random() * 1e9),
            },
        });
    });
    // Anything that didn't fit goes wherever there's room at the edges.
    things.slice(thing).forEach((item, i) => {
        const [w, h] = GROUND_SIZE[item.form];
        laid.push({
            item,
            form: item.form,
            place: { x: 60 + ((i * 137) % 880), y: 960, w, h, rot: between(-10, 10), zone: "ground", z: 25, seed: i },
        });
    });

    return laid;
}

/** The camera's route when zooming in: tip of the leaf, down and around into the spiral. */
export function cameraRoute(stops = 60): Point[] {
    const route: Point[] = [];
    // Start where the upper edge meets the tip, then run the stroke backwards.
    for (let i = 0; i <= stops; i++) {
        const d = strokeLength - (strokeLength * i) / stops;
        const p = along(d);
        route.push({ x: +p.x.toFixed(1), y: +p.y.toFixed(1) });
    }
    return route;
}
