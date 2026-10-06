// Lays tiles out along the Hidden Leaf insignia: a spiral around the anchor
// photo, and a leaf point drawn up and away to the upper left.
//
// Everything is in a 1000x1000 design space; the page scales it to pixels.

export interface Point {
    x: number;
    y: number;
}

export interface Placement extends Point {
    width: number;
    height: number;
    /** Degrees. */
    tilt: number;
}

/** Spiral center, where the anchor sits. */
export const CENTER: Point = { x: 600, y: 520 };
export const ANCHOR_SIZE = 200;

const R0 = 172; // innermost radius, just outside the anchor
const R1 = 400; // outermost radius
const TURNS = 1.6;
// The spiral ends at the bottom (90°), heading left into the leaf.
const THETA1 = Math.PI / 2 + 2 * Math.PI * Math.ceil(TURNS);
const THETA0 = THETA1 - TURNS * 2 * Math.PI;
const B = (R1 - R0) / (THETA1 - THETA0);

const TIP: Point = { x: 90, y: 110 };
const LEAF_CONTROL: Point = { x: 150, y: 900 };

const radius = (theta: number) => R0 + B * (theta - THETA0);
const onSpiral = (theta: number): Point => ({
    x: CENTER.x + radius(theta) * Math.cos(theta),
    y: CENTER.y + radius(theta) * Math.sin(theta),
});

const SPIRAL_END = onSpiral(THETA1);
// Where the leaf's upper edge rejoins the spiral, stopped short so tiles don't
// pile onto the spiral's own.
const UPPER_JOIN = (() => {
    const join = onSpiral(THETA1 - (225 * Math.PI) / 180);
    return { x: TIP.x + (join.x - TIP.x) * 0.78, y: TIP.y + (join.y - TIP.y) * 0.78 };
})();

const bezier = (t: number): Point => {
    const u = 1 - t;
    return {
        x: u * u * SPIRAL_END.x + 2 * u * t * LEAF_CONTROL.x + t * t * TIP.x,
        y: u * u * SPIRAL_END.y + 2 * u * t * LEAF_CONTROL.y + t * t * TIP.y,
    };
};

/** Deterministic jitter so the collage looks hand-placed but never reshuffles. */
const jitter = (i: number, salt: number) => {
    const s = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
    return s - Math.floor(s) - 0.5;
};

const sized = (size: number, shape: { w: number; h: number }) => {
    const aspect = Math.min(1.9, Math.max(0.66, shape.w / shape.h));
    return { width: size * Math.sqrt(aspect), height: size / Math.sqrt(aspect) };
};

/** The insignia as an SVG path, for the brush stroke behind the tiles. */
export function insigniaPath(): string {
    const points: Point[] = [];
    for (let i = 0; i <= 200; i++) {
        points.push(onSpiral(THETA0 - 0.6 + ((THETA1 - THETA0 + 0.6) * i) / 200));
    }
    for (let i = 1; i <= 40; i++) points.push(bezier(i / 40));
    points.push(onSpiral(THETA1 - (225 * Math.PI) / 180));
    return points
        .map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
        .join(" ");
}

/**
 * Places `spiral` items from the inside out, sized by their distance from the
 * center, and `leaf` items along the leaf's two edges.
 */
export function layoutLeaf(
    spiral: { shape: { w: number; h: number } }[],
    leaf: { shape: { w: number; h: number } }[],
): { spiral: Placement[]; leaf: Placement[] } {
    // Equal angular steps with size proportional to radius keeps neighbors
    // just touching all the way out.
    const step = (THETA1 - THETA0) / spiral.length;
    const spiralPlacements = spiral.map((item, i) => {
        const theta = THETA0 + step * (i + 0.5);
        const r = radius(theta);
        const p = onSpiral(theta);
        return {
            ...p,
            ...sized(step * r * 0.94, item.shape),
            tilt: jitter(i, 1) * 9,
        };
    });

    // Sample the leaf outline (curve to the tip, then back toward the spiral)
    // and space tiles evenly along it.
    const outline: Point[] = [];
    for (let i = 0; i <= 80; i++) outline.push(bezier(0.12 + (0.88 * i) / 80));
    for (let i = 1; i <= 20; i++) {
        outline.push({
            x: TIP.x + ((UPPER_JOIN.x - TIP.x) * i) / 20,
            y: TIP.y + ((UPPER_JOIN.y - TIP.y) * i) / 20,
        });
    }
    const lengths = [0];
    for (let i = 1; i < outline.length; i++) {
        lengths.push(
            lengths[i - 1] +
                Math.hypot(outline[i].x - outline[i - 1].x, outline[i].y - outline[i - 1].y),
        );
    }
    const total = lengths[lengths.length - 1];
    const spacing = total / leaf.length;
    const at = (distance: number): Point => {
        const i = Math.max(1, lengths.findIndex((l) => l >= distance));
        const t = (distance - lengths[i - 1]) / (lengths[i] - lengths[i - 1] || 1);
        return {
            x: outline[i - 1].x + (outline[i].x - outline[i - 1].x) * t,
            y: outline[i - 1].y + (outline[i].y - outline[i - 1].y) * t,
        };
    };
    const leafPlacements = leaf.map((item, i) => ({
        ...at(spacing * (i + 0.5)),
        ...sized(spacing * 0.92, item.shape),
        tilt: jitter(i, 2) * 10,
    }));

    return { spiral: spiralPlacements, leaf: leafPlacements };
}

/** Bounding box of everything placed, for fitting it to the viewport. */
export function bounds(placements: Placement[]) {
    const xs = placements.flatMap((p) => [p.x - p.width / 2, p.x + p.width / 2]);
    const ys = placements.flatMap((p) => [p.y - p.height / 2, p.y + p.height / 2]);
    const anchor = ANCHOR_SIZE * 0.6;
    return {
        left: Math.min(...xs, CENTER.x - anchor),
        right: Math.max(...xs, CENTER.x + anchor),
        top: Math.min(...ys, CENTER.y - anchor),
        bottom: Math.max(...ys, CENTER.y + anchor),
    };
}
