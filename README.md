# pujitm.xyz

using astro because the logo and cli are cool.

## Commonplace book

The homepage opens on Einstein and a hello, then a collage in which the
things themselves form the Hidden Leaf, in their own colors, grouped by theme
rather than medium: the heroic-moral make the leaf, the tragic-psychological
the spiral's outer arc and stem, and the romantic-spiritual curl in to the
Buddha at its eye. Within a theme, books, pictures, music and notes are mixed
by color. Scrolling breaks the spell and everything settles into a board, one
band per theme. Hover to lift a piece; click to open it or hear it.

- Each entry is a markdown file in `src/content/commonplace/`; anything written
  below the frontmatter shows on its page at `/commonplace/<file-name>`. Every
  entry needs a `theme`: `heroic-moral`, `tragic-psychological` or
  `romantic-spiritual`. The schema, with comments, is in
  `src/content.config.ts`.
- The themes and the picture at the eye are in `src/data/collage.ts`; how the
  symbol is traced and built, and the board, in `src/lib/leaf.ts`; the order
  within a theme in `src/lib/commonplace.ts`; the motion in
  `src/styles/collage.css`.
- Works and talks come from `src/data/works.ts`, and blog posts are pulled in
  from `src/pages/blog/`; give each a `theme` too (a post without one goes
  with heroic-moral).
- Music: `incipit` is the opening in [ABC notation](https://abcnotation.com),
  and each movement's `recording` takes a YouTube id with optional `start` and
  `end` seconds for trimming applause.
- Images are self-hosted in `public/images/remote/`. Add an image URL to an
  entry and push: the "Self-host images" workflow downloads it and commits the
  file (or run `npm run images` yourself). An image's `fallback` is only
  downloaded if the image itself can't be.
- Book covers come from Open Library by ISBN
  (`https://covers.openlibrary.org/b/isbn/<ISBN-13>-L.jpg?default=false`), with
  Amazon's (`https://images-na.ssl-images-amazon.com/images/P/<ISBN-10>.01.LZZZZZZZ.jpg`)
  as the fallback. A book whose cover can't be found shows a plain one in its
  `color`.
