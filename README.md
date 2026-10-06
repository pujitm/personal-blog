# pujitm.xyz

using astro because the logo and cli are cool.

## Commonplace book

Two takes on the same collection: `/leaf` (tiles laid along the Hidden Leaf
insignia, zooms into Einstein as you scroll) and `/grid` (a dense mosaic).

- Each entry is a markdown file in `src/content/commonplace/`; anything written
  below the frontmatter shows on its page at `/commonplace/<file-name>`. The
  schema, with comments, is in `src/content.config.ts`.
- Works and talks come from `src/data/works.ts`, and blog posts are pulled in
  from `src/pages/blog/`.
- `shape: 4x2` sets an entry's grid footprint (columns x rows). Tiles are
  container queries all the way down, so they adapt to whatever shape they get.
- Music: `incipit` is the opening in [ABC notation](https://abcnotation.com),
  and each movement's `recording` takes a YouTube id with optional `start` and
  `end` seconds for trimming applause.
