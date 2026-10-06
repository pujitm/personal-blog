import { getCollection, type CollectionEntry } from "astro:content";
import { works } from "../data/works";

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
    /** Grid footprint in columns and rows. */
    shape: { w: number; h: number };
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

const DEFAULT_SHAPES: Record<ItemKind, string> = {
    music: "4x2",
    anime: "3x3",
    film: "2x3",
    book: "2x3",
    game: "3x3",
    character: "3x3",
    image: "3x3",
    work: "3x2",
    writing: "3x2",
};

/** The photo everything else orbits. */
export const anchor = {
    title: "Albert Einstein, 1951",
    image: {
        src: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Albert_Einstein_sticks_his_tongue.jpg/960px-Albert_Einstein_sticks_his_tongue.jpg",
        alt: "Albert Einstein sticking his tongue out at the camera on his 72nd birthday.",
        credit: "Arthur Sasse / International News Service, public domain, via Wikimedia Commons",
    },
};

const parseShape = (shape: string) => {
    const [w, h] = shape.split("x").map(Number);
    return { w, h };
};

export const entryHref = (id: string) => `/commonplace/${id}`;

/** Spread each kind evenly through the list so the collage doesn't clump. */
function interleave<T extends { kind: string }>(items: T[]): T[] {
    const counts = new Map<string, number>();
    for (const item of items) counts.set(item.kind, (counts.get(item.kind) ?? 0) + 1);
    const seen = new Map<string, number>();
    return items
        .map((item, index) => {
            const nth = seen.get(item.kind) ?? 0;
            seen.set(item.kind, nth + 1);
            return { item, index, rank: (nth + 0.5) / counts.get(item.kind)! };
        })
        .sort((a, b) => a.rank - b.rank || a.index - b.index)
        .map(({ item }) => item);
}

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
        shape: parseShape(data.shape ?? DEFAULT_SHAPES[data.kind]),
    };
}

/** Things I love, interleaved. */
export async function getInfluences(): Promise<CollageItem[]> {
    const entries = (await getCollection("commonplace"))
        .filter((entry) => !entry.data.draft)
        .sort((a, b) => (a.data.order ?? Infinity) - (b.data.order ?? Infinity));
    return interleave(entries.map(fromEntry));
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
                shape: parseShape(DEFAULT_SHAPES.writing),
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
            shape: parseShape(DEFAULT_SHAPES.work),
        };
    });

    return [...posts, ...made].sort(
        (a, b) => b.date!.valueOf() - a.date!.valueOf(),
    );
}

export async function getCollage() {
    const influences = await getInfluences();
    const output = getOutput();
    return { influences, output, all: [...influences, ...output] };
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
