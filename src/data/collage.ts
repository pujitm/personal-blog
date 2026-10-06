// The collage. The Hidden Leaf is built from the things themselves, in their
// own colors, grouped by theme rather than by medium (see src/lib/leaf.ts for
// which part of the symbol each theme makes). Scrolling breaks the spell and
// everything settles into a board, one band per theme, in this order.
export const THEMES = [
    { id: "heroic-moral", label: "Heroic-moral" },
    { id: "tragic-psychological", label: "Tragic-psychological" },
    { id: "romantic-spiritual", label: "Romantic-spiritual" },
] as const;

export type Theme = (typeof THEMES)[number]["id"];

export const THEME_IDS = THEMES.map((theme) => theme.id) as [Theme, ...Theme[]];

export const themeLabel = (id: Theme) => THEMES.find((theme) => theme.id === id)!.label;

/** The picture at the spiral's eye, where it curls into the romantic-spiritual. */
export const EYE = "buddha";
