import { getCollection, type CollectionEntry } from "astro:content";
import { works } from "../data/works";
import { EYE, THEME_LAYOUT, THEMES, type Theme } from "../data/collage";
import { imageInfo } from "./images";
import type { Form } from "./leaf";

type Entry = CollectionEntry<"commonplace">;
type EntryData = Entry["data"];

export type ItemKind = EntryData["kind"] | "work" | "writing";
export type Image = EntryData["images"][number];
export type Music = NonNullable<EntryData["music"]>;

export interface CollageItem {
    id: string;
    kind: ItemKind;
    theme: Theme;
    title: string;
    subtitle?: string;
    note?: string;
    description?: string;
    date?: Date;
    href: string;
    external: boolean;
    images: Image[];
    color?: string;
    shelf?: EntryData["shelf"];
    music?: Music;
    /** Footprint from frontmatter, used when the composition doesn't place it. */
    shape?: string;
}

export const KIND_LABELS: Record<ItemKind, string> = {
    music: "Music",
    anime: "Anime",
    film: "Film",
    book: "Book",
    game: "Game",
    character: "Character",
    image: "Image",
    work: "Work",
    writing: "Writing",
};

export { anchor } from "../data/anchor";

export const entryHref = (id: string) => `/commonplace/${id}`;

function fromEntry(entry: Entry): CollageItem {
    const { data } = entry;
    return {
        id: entry.id,
        kind: data.kind,
        theme: data.theme,
        title: data.title,
        subtitle: data.subtitle,
        note: data.note,
        href: entryHref(entry.id),
        external: false,
        images: data.images,
        color: data.color,
        shelf: data.shelf,
        music: data.music,
        shape: data.shape,
    };
}

const themeRank = (theme: Theme) => THEMES.findIndex((t) => t.id === theme);
const kindRank = (kind: ItemKind) => Object.keys(KIND_LABELS).indexOf(kind);

/** Things I love, by theme. */
export async function getInfluences(): Promise<CollageItem[]> {
    const entries = (await getCollection("commonplace"))
        .filter((entry) => !entry.data.draft)
        .map(fromEntry);
    return entries.sort((a, b) => themeRank(a.theme) - themeRank(b.theme) || kindRank(a.kind) - kindRank(b.kind));
}

/** Things I've made: works, talks and blog posts, newest first. */
export function getOutput(): CollageItem[] {
    const posts = Object.values(
        import.meta.glob<{ frontmatter: Record<string, any>; url: string }>(
            "../pages/blog/*.{md,mdx}",
            { eager: true },
        ),
    )
        .filter((post) => !post.frontmatter.draft)
        .map(
            (post): CollageItem => ({
                id: post.url,
                kind: "writing",
                // Posts without one go with the first theme.
                theme: post.frontmatter.theme ?? THEMES[0].id,
                title: post.frontmatter.title,
                description: post.frontmatter.description || undefined,
                date: new Date(post.frontmatter.pubDate),
                href: post.url,
                external: false,
                images: [],
            }),
        );

    const made = works.map((work): CollageItem => {
        const href =
            work.link?.href ?? `https://www.youtube.com/watch?v=${work.youtube}`;
        return {
            id: href,
            kind: work.link?.href.startsWith("/") ? "writing" : "work",
            theme: work.theme,
            title: work.title,
            description: work.description,
            date: work.date,
            href,
            external: /^https?:/.test(href),
            images: [],
        };
    });

    return [...posts, ...made].sort(
        (a, b) => b.date!.valueOf() - a.date!.valueOf(),
    );
}

export interface Laid {
    item: CollageItem;
    form: Form;
    aspect?: number;
    /** A transparent cut-out rather than a rectangle. */
    alpha?: boolean;
    /** Dominant color of its picture. */
    color?: [number, number, number];
}

/** What each thing is made of. */
function formFor(item: CollageItem): Form {
    if (item.kind === "book") return "cover";
    if (item.music || item.images.length > 2) return "wide";
    if (item.kind === "work") return "card";
    if (item.kind === "writing") return "square";
    return "image";
}

const hexRgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];

/** A thing's color: its picture's, else the one noted for it. */
export const colorOf = (laid: Laid): [number, number, number] =>
    laid.color ?? (laid.item.color ? hexRgb(laid.item.color) : [240, 236, 226]);

/** Hue for colorful things; neutrals sort after them, by lightness. */
function hueOf([r, g, b]: [number, number, number]) {
    const [R, G, B] = [r / 255, g / 255, b / 255];
    const max = Math.max(R, G, B);
    const min = Math.min(R, G, B);
    const l = (max + min) / 2;
    const d = max - min;
    const s = d === 0 ? 0 : l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (s < 0.18) return 400 + l * 100;
    const h = max === R ? (G - B) / d + (G < B ? 6 : 0) : max === G ? (B - R) / d + 2 : (R - G) / d + 4;
    return h * 60;
}

/** Slips each of `extra` evenly in among `base`. */
function spread<T>(base: T[], extra: T[]) {
    const out = [...base];
    extra.forEach((thing, i) => out.splice(Math.round(((i + 0.5) * out.length) / extra.length), 0, thing));
    return out;
}

/**
 * One theme, in the order it runs along the symbol and settles on the board:
 * pictures and covers together by color, with notes and sheet music spread
 * evenly through them so no one medium bunches up. Colors run one way, then
 * back the other way in the next theme, so neighboring themes meet in
 * similar colors.
 */
function arrange(group: Laid[], k: number) {
    const note = (laid: Laid) => laid.form === "card" || laid.form === "square";
    const direction = k % 2 ? -1 : 1;
    const pictures = group
        .filter((laid) => !laid.item.music && !note(laid))
        .sort((a, b) => direction * (hueOf(colorOf(a)) - hueOf(colorOf(b))));
    const notes = group.filter(note);
    const music = group.filter((laid) => laid.item.music);
    return spread(spread(pictures, notes), music);
}

/**
 * The themes one after another. Blended, the tail of each theme and the head
 * of the next interleave, a little more of the next at each step, so one
 * runs into the other.
 */
function sequence(themes: Laid[][]) {
    if (THEME_LAYOUT === "separate") return themes.flat();
    const OVERLAP = 0.25; // of a theme's span, into each neighbor's
    return themes
        .flatMap((group, k) =>
            group.map((laid, j) => ({ laid, key: k - OVERLAP + ((1 + 2 * OVERLAP) * (j + 0.5)) / group.length })),
        )
        .sort((a, b) => a.key - b.key)
        .map(({ laid }) => laid);
}

async function build() {
    const everything = [...(await getInfluences()), ...getOutput()];
    const laid: Laid[] = await Promise.all(
        everything.map(async (item) => ({
            item,
            form: formFor(item),
            ...(item.images[0] ? await imageInfo(item.images[0].src, item.images[0].fallback) : {}),
        })),
    );
    const eye = laid.filter((l) => l.item.id === EYE);
    const rest = laid.filter((l) => l.item.id !== EYE);
    const items = [
        ...sequence(THEMES.map((theme, k) => arrange(rest.filter((l) => l.item.theme === theme.id), k))),
        ...eye,
    ];
    const mine = (item: CollageItem) => item.kind === "work" || item.kind === "writing";
    return {
        /** Everything, by theme, in collage order; the eye last. */
        items,
        /** The things I love, in the same order. */
        influences: items.map((l) => l.item).filter((item) => !mine(item)),
    };
}

let built: ReturnType<typeof build> | undefined;

/** Everything on the collage, by theme, in the order it runs. */
export function getCollage() {
    // Every page needs it (for credits), so work it out once per build.
    if (!import.meta.env.PROD) return build();
    return (built ??= build());
}

export function formatDate(date: Date) {
    return date.toLocaleDateString("en-us", { year: "numeric", month: "short" });
}

/** What the player needs for one movement. */
export interface Track {
    youtube: string;
    start?: number;
    end?: number;
    title: string;
    subtitle: string;
    href: string;
}

export function tracksFor(id: string, music: Music): Track[] {
    return music.movements.flatMap((movement) =>
        movement.recording
            ? [
                  {
                      ...movement.recording,
                      title:
                          music.movements.length > 1
                              ? `${music.work} · ${movement.title}`
                              : music.work,
                      subtitle: `${music.composer} · ${music.performer}`,
                      href: entryHref(id),
                  },
              ]
            : [],
    );
}
