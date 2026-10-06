# pujitm.xyz

using astro because the logo and cli are cool.

## Commonplace book

The homepage opens on Einstein and a hello, then a collage. It starts
scattered, with the Hidden Leaf cut through it: inside the symbol every piece
is warm, outside cool, so the shape slices across whatever lies on its edge.
Scrolling breaks the spell: pieces straighten, settle into a board grouped by
kind, and show their true colors. Hover to lift a piece; click to open it or
hear it.

- Each entry is a markdown file in `src/content/commonplace/`; anything written
  below the frontmatter shows on its page at `/commonplace/<file-name>`. The
  schema, with comments, is in `src/content.config.ts`.
- Palettes, board order and which pieces are featured live in
  `src/data/collage.ts`; scattering, the board and the symbol mask in
  `src/lib/leaf.ts`; the motion in `src/styles/collage.css`.
- Works and talks come from `src/data/works.ts`, and blog posts are pulled in
  from `src/pages/blog/`.
- Music: `incipit` is the opening in [ABC notation](https://abcnotation.com),
  and each movement's `recording` takes a YouTube id with optional `start` and
  `end` seconds for trimming applause.
- Images are self-hosted in `public/images/remote/`. Add an image URL to an
  entry and push: the "Self-host images" workflow downloads it and commits the
  file (or run `npm run images` yourself).
