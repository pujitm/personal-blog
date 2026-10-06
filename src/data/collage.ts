// The collage. Everything starts scattered, and the Hidden Leaf symbol is
// cut through it: inside the symbol every piece is warm, outside it's cool,
// so the shape slices across photos and paper wherever they happen to lie.
// Scrolling breaks the spell: pieces straighten, settle into a board grouped
// by kind, and show their true colors.

/** Inside the symbol: papers and photo tints (hue-rotate on a sepia base). */
export const WARM = {
    papers: ["#d63a1a", "#e8572a", "#f07f2e", "#f4a53b", "#e2463f", "#c92f2f", "#f39167", "#eb6a3d"],
    tints: [-28, -14, 0, 14, -42, -22],
};

/** Outside: cool and muted, with Konoha's leaf green in the mix. */
export const COOL = {
    papers: ["#2f4a6d", "#3e6b77", "#5b7f66", "#7c93a8", "#d9dee0", "#28333f", "#8aa39a", "#c7cfd4", "#45607a"],
    tints: [160, 180, 200, 215, 80, 120],
};

/** The order things settle into once the spell breaks. */
export const BOARD_ORDER = ["music", "anime", "character", "film", "image", "game", "book", "work", "writing"] as const;

/** A little bigger than the rest while scattered. */
export const FEATURED = ["naruto", "beethoven-moonlight-sonata", "buddha", "uncle-iroh", "korra", "ramayana-the-legend-of-prince-rama"];

/** Typed scraps among the paper. */
export const TYPE_SCRAPS = ["1951", "op. 72", "♩ = 69", "木ノ葉", "op. 27 no. 2", "K. 466", "Will of Fire", "awp_lego_2", "op. 23", "S. 141"];
