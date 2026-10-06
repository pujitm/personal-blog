import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const recording = z.object({
    /** YouTube video id. */
    youtube: z.string(),
    /** Seconds. Use to skip talking/tuning before the music starts. */
    start: z.number().optional(),
    /** Seconds. Use to stop before applause. */
    end: z.number().optional(),
});

const movement = z.object({
    title: z.string(),
    /** Opening measures in ABC notation (https://abcnotation.com). */
    incipit: z.string().optional(),
    recording: recording.optional(),
});

const image = z.object({
    src: z.string(),
    /** Tried if `src` fails to load (hotlinks break). */
    fallback: z.string().optional(),
    alt: z.string(),
    credit: z.string().optional(),
    /** CSS object-position, for cropping into tiles. */
    focus: z.string().optional(),
});

/**
 * One page of the commonplace book. Each file in src/content/commonplace is an
 * entry; the markdown body is the writing that shows on its own page.
 */
const commonplace = defineCollection({
    loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/commonplace" }),
    schema: z.object({
        title: z.string(),
        kind: z.enum(["music", "anime", "film", "book", "game", "character", "image"]),
        /** Performer, author, year: whatever goes under the title. */
        subtitle: z.coerce.string().optional(),
        /** A line in the margin, in my own words. */
        note: z.string().optional(),
        images: z.array(image).default([]),
        /** Book cover color when there is no cover image. */
        color: z.string().optional(),
        /** Grid footprint as columns x rows, e.g. "4x2". Defaults by kind. */
        shape: z.string().regex(/^\d+x\d+$/).optional(),
        /** Book shelf. */
        shelf: z.enum(["reading", "favorite"]).optional(),
        /** Lower sorts first. Entries without one keep file order. */
        order: z.number().optional(),
        music: z
            .object({
                composer: z.string(),
                work: z.string(),
                performer: z.string(),
                key: z.string().optional(),
                movements: z.array(movement).min(1),
            })
            .optional(),
        draft: z.boolean().default(false),
    }),
});

export const collections = { commonplace };
