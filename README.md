# pujitm.xyz

using astro because the logo and cli are cool.

## Commonplace book

The homepage opens on Einstein and a hello, then a collage in which the
things themselves form the Hidden Leaf, in their own colors: books stand along
the leaf like a shelf, pictures and sheet music run around the spiral, notes
curl into its heart, Naruto sits at its eye. Scrolling breaks the spell and
everything settles into a board grouped by kind. Hover to lift a piece; click
to open it or hear it.

- Each entry is a markdown file in `src/content/commonplace/`; anything written
  below the frontmatter shows on its page at `/commonplace/<file-name>`. The
  schema, with comments, is in `src/content.config.ts`.
- Board order and the picture at the eye are in `src/data/collage.ts`; how
  the symbol is traced and built, and the board, in `src/lib/leaf.ts`; the
  motion in `src/styles/collage.css`.
- Works and talks come from `src/data/works.ts`, and blog posts are pulled in
  from `src/pages/blog/`.
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
