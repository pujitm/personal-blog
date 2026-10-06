// The collage, in the order pieces are laid down (roughly top to bottom).
//
// shape: footprint on the 12-column desktop grid, as columns x half-columns
//        (so "4x8" is a 4:4 square and "6x3" a 4:1 strip). Smaller screens
//        scale it down keeping the aspect ratio.
// treatment: what the piece is made of.
// depth: 0 (flat on the page) to 3 (floats the most as you scroll).
//
// Entries not listed here are added at the end; works and blog posts are
// spread evenly through as index cards and sticky notes; books on the
// "reading" shelf become one stack of spines.

export type Treatment =
    | "print" // photo print with a white border
    | "polaroid" // white frame, fat bottom, handwritten caption
    | "cutout" // scissor-cut, no border
    | "loose" // transparent or white-background image laid straight on the paper
    | "filmstrip" // frames on a strip of film
    | "strip" // torn strip of staff paper (music)
    | "cover"; // a book cover

export interface Art {
    id: string;
    shape: string;
    treatment: Treatment;
    depth?: number;
}

export const composition: Art[] = [
    { id: "naruto", shape: "7x8", treatment: "print", depth: 1 },
    { id: "beethoven-moonlight-sonata", shape: "6x5", treatment: "strip", depth: 3 },
    { id: "buddha", shape: "4x11", treatment: "print", depth: 0 },
    { id: "uncle-iroh", shape: "5x6", treatment: "cutout", depth: 2 },
    { id: "chopin-nocturne-e-minor", shape: "5x4", treatment: "strip", depth: 3 },
    { id: "@reading", shape: "5x10", treatment: "cover", depth: 1 },
    { id: "interstellar", shape: "3x9", treatment: "print", depth: 2 },
    { id: "beethoven-appassionata", shape: "5x4", treatment: "strip", depth: 3 },
    { id: "ramayana-the-legend-of-prince-rama", shape: "8x5", treatment: "filmstrip", depth: 1 },
    { id: "korra", shape: "5x6", treatment: "polaroid", depth: 2 },
    { id: "beethoven-pathetique", shape: "5x4", treatment: "strip", depth: 2 },
    { id: "melee-fox-marth", shape: "4x6", treatment: "loose", depth: 2 },
    { id: "the-westing-game", shape: "2x6", treatment: "cover", depth: 1 },
    { id: "chopin-grande-valse-brillante", shape: "5x4", treatment: "strip", depth: 3 },
    { id: "your-lie-in-april", shape: "3x9", treatment: "print", depth: 1 },
    { id: "aang", shape: "5x6", treatment: "polaroid", depth: 2 },
    { id: "mozart-piano-concerto-20", shape: "5x4", treatment: "strip", depth: 3 },
    { id: "rocket-league-fennec-octane", shape: "5x5", treatment: "loose", depth: 3 },
    { id: "three-idiots", shape: "3x9", treatment: "print", depth: 1 },
    { id: "schoenberg-verklarte-nacht", shape: "5x4", treatment: "strip", depth: 3 },
    { id: "steins-gate", shape: "3x9", treatment: "cutout", depth: 2 },
    { id: "awp-lego-2", shape: "5x5", treatment: "loose", depth: 3 },
    { id: "liszt-la-campanella", shape: "5x4", treatment: "strip", depth: 3 },
    { id: "the-price-of-the-ticket", shape: "2x6", treatment: "cover", depth: 1 },
    { id: "code-geass", shape: "3x8", treatment: "polaroid", depth: 2 },
    { id: "chopin-ballade-1", shape: "5x4", treatment: "strip", depth: 3 },
    { id: "genie", shape: "3x7", treatment: "loose", depth: 2 },
    { id: "rush-hour", shape: "3x9", treatment: "print", depth: 1 },
    { id: "saint-saens-introduction-and-rondo-capriccioso", shape: "5x4", treatment: "strip", depth: 2 },
];

