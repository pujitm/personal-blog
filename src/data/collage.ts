// The collage. The Hidden Leaf symbol isn't drawn anywhere: it emerges
// because the pieces listed in `leaf` are laid along its stroke in warm
// vermilion and orange, while everything else is neutral ground around them.
//
// `leaf` runs from the heart of the spiral outward, around the bottom, up to
// the tip and back. Long pieces (sheet music, the Ramayana film strip) and
// book spines follow the curve; photos sit across it. Anything not listed
// becomes ground: grayscale, laid loosely underneath.

export const leaf: string[] = [
    "chopin-nocturne-e-minor",
    "naruto",
    "beethoven-moonlight-sonata",
    "aang",
    "the-westing-game",
    "beethoven-appassionata",
    "korra",
    "buddha",
    "chopin-grande-valse-brillante",
    "your-lie-in-april",
    "ramayana-the-legend-of-prince-rama",
    "mozart-piano-concerto-20",
    "uncle-iroh",
    "the-price-of-the-ticket",
    "chopin-ballade-1",
    "code-geass",
    "three-idiots",
    "beethoven-pathetique",
    "genie",
    "liszt-la-campanella",
    "steins-gate",
    "interstellar",
    "schoenberg-verklarte-nacht",
    "saint-saens-introduction-and-rondo-capriccioso",
];

/** Leaf papers, from deep to light. */
export const WARM = ["#c62f17", "#d8431c", "#e2581f", "#ec6f2a", "#f08a3c", "#b9301a", "#df4a2a", "#f39a5b"];

/** Ground papers. */
export const NEUTRAL = ["#f7f4ec", "#ebe7dd", "#dcd8cf", "#c9c6bf", "#8f8d88", "#efeae0", "#b9bdc0", "#d6d9d8"];

/** Book covers on the ground, muted so they don't compete with the leaf. */
export const NEUTRAL_COVERS = ["#2b2b2a", "#3d4a52", "#5c6b66", "#e9e4d8", "#4a4f5a", "#7d8580", "#1f2a33", "#cfc8b8"];

/** Typed scraps on the ground. */
export const TYPE_SCRAPS = ["1951", "op. 72", "♩ = 69", "木ノ葉", "op. 27 no. 2", "K. 466", "Will of Fire", "awp_lego_2", "op. 23", "S. 141"];
