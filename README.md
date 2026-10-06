# pujitm.xyz

using astro because the logo and cli are cool.

## Commonplace book

The homepage opens on Einstein and a hello, then a collage. Nothing draws the
Hidden Leaf: pieces laid along its stroke are warm vermilion and orange, the
rest is neutral ground, so the symbol emerges from far away. Scrolling zooms
in at the leaf's tip and travels around the spiral; hovering a piece lifts it
and shows its real colors.

- Each entry is a markdown file in `src/content/commonplace/`; anything written
  below the frontmatter shows on its page at `/commonplace/<file-name>`. The
  schema, with comments, is in `src/content.config.ts`.
- Which things form the leaf, in what order, and the palettes are in
  `src/data/collage.ts`; the geometry and packing are in `src/lib/leaf.ts`.
- Works and talks come from `src/data/works.ts`, and blog posts are pulled in
  from `src/pages/blog/`.
- Music: `incipit` is the opening in [ABC notation](https://abcnotation.com),
  and each movement's `recording` takes a YouTube id with optional `start` and
  `end` seconds for trimming applause.
- Images are self-hosted in `public/images/remote/`. Add an image URL to an
  entry and push: the "Self-host images" workflow downloads it and commits the
  file (or run `npm run images` yourself).
