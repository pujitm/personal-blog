import { getCollection, type CollectionEntry } from "astro:content";
import { works } from "../data/works";
import { leaf as leafOrder } from "../data/collage";
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

const placed = new Map(leafOrder.map((id, i) => [id, i]));

/** Things I love, leaf first in leaf order, then the rest. */
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

export interface Laid {
    item: CollageItem;
    form: Form;
    aspect?: number;
    /** A transparent cut-out rather than a rectangle. */
    alpha?: boolean;
}

/** What each thing is made of, given where it lies. */
function formFor(item: CollageItem, onLeaf: boolean): Form {
    if (item.music || item.images.length > 2) return "wide";
    if (item.kind === "book" && !item.images.length) return onLeaf ? "spine" : "cover";
    if (item.kind === "work") return "card";
    if (item.kind === "writing") return "square";
    return "image";
}

/** Everything on the collage, split into the leaf and the ground. */
export async function getCollage() {
    const influences = await getInfluences();
    const output = getOutput();
    const lay = async (item: CollageItem, onLeaf: boolean): Promise<Laid> => ({
        item,
        form: formFor(item, onLeaf),
        ...(item.images[0] ? await imageInfo(item.images[0].src) : {}),
    });
    const leaf = await Promise.all(influences.filter((i) => placed.has(i.id)).map((i) => lay(i, true)));
    const ground = await Promise.all(
        [...influences.filter((i) => !placed.has(i.id)), ...output].map((i) => lay(i, false)),
    );
    return { influences, output, leaf, ground, everything: [...influences, ...output] };
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
