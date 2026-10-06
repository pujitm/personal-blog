import { getCollection, type CollectionEntry } from "astro:content";
import { works } from "../data/works";
import { composition, type Art } from "../data/collage";

type Entry = CollectionEntry<"commonplace">;
type EntryData = Entry["data"];

export type ItemKind = EntryData["kind"] | "work" | "writing";
export type Image = EntryData["images"][number];
export type Music = NonNullable<EntryData["music"]>;

export interface CollageItem {
    id: string;
    kind: ItemKind;
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

const placed = new Map(composition.map((art, i) => [art.id, i]));

/** Things I love, in collage order. */
export async function getInfluences(): Promise<CollageItem[]> {
    const entries = (await getCollection("commonplace"))
        .filter((entry) => !entry.data.draft)
        .sort(
            (a, b) =>
                (placed.get(a.id) ?? Infinity) - (placed.get(b.id) ?? Infinity) ||
                (a.data.order ?? Infinity) - (b.data.order ?? Infinity),
        );
    return entries.map(fromEntry);
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

export type Piece =
    | { type: "item"; item: CollageItem; art: Art }
    | { type: "stack"; books: CollageItem[]; art: Art };

const DEFAULT_ART: Partial<Record<ItemKind, Omit<Art, "id">>> = {
    music: { shape: "5x4", treatment: "strip", depth: 3 },
    book: { shape: "2x6", treatment: "cover", depth: 1 },
    work: { shape: "3x4", treatment: "print", depth: 1 },
    writing: { shape: "2x4", treatment: "print", depth: 2 },
};

const artFor = (item: CollageItem): Art => {
    const listed = composition.find((art) => art.id === item.id);
    if (listed) return listed;
    const fallback = DEFAULT_ART[item.kind] ?? { shape: "3x6", treatment: "print", depth: 1 };
    return { id: item.id, ...fallback, shape: item.shape ?? fallback.shape };
};

/** Everything on the collage, in the order it's laid down. */
export async function getCollage() {
    const influences = await getInfluences();
    const output = getOutput();

    // Books I'm reading now become one stack, wherever "@reading" sits.
    const reading = influences.filter((item) => item.kind === "book" && item.shelf === "reading");
    const stackAt = composition.findIndex((art) => art.id === "@reading");
    const pieces: Piece[] = [];
    for (const item of influences) {
        if (reading.includes(item)) continue;
        if (stackAt >= 0 && pieces.length === stackAt && reading.length) {
            pieces.push({ type: "stack", books: reading, art: composition[stackAt] });
        }
        pieces.push({ type: "item", item, art: artFor(item) });
    }

    // Spread what I've made evenly through the rest.
    const laid: Piece[] = [];
    let made = 0;
    pieces.forEach((piece, i) => {
        laid.push(piece);
        const due = Math.floor(((i + 1) * output.length) / pieces.length);
        while (made < due) {
            const item = output[made++];
            laid.push({ type: "item", item, art: artFor(item) });
        }
    });

    return { influences, output, pieces: laid, everything: [...influences, ...output] };
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
