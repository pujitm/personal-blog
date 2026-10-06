// The collage. The Hidden Leaf is built from the things themselves, in their
// own colors, grouped by theme rather than by medium. Scrolling breaks the
// spell and everything settles into a board, theme after theme, in this
// order.
export const THEMES = [
    { id: "heroic-moral", label: "Heroic-moral" },
    { id: "tragic-psychological", label: "Tragic-psychological" },
    { id: "romantic-spiritual", label: "Romantic-spiritual" },
] as const;

export type Theme = (typeof THEMES)[number]["id"];

export const THEME_IDS = THEMES.map((theme) => theme.id) as [Theme, ...Theme[]];

/**
 * How the themes sit together.
 *   "blend"     one line through the symbol and down the board, each theme
 *               running into the next
 *   "separate"  each theme makes its own part of the symbol (see
 *               src/lib/leaf.ts) and its own band on the board
 */
export const THEME_LAYOUT: "blend" | "separate" = "blend";

/** The picture at the spiral's eye, where it curls into the romantic-spiritual. */
export const EYE = "buddha";
