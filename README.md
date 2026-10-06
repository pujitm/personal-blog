# pujitm.xyz

using astro because the logo and cli are cool.

## Commonplace book

The homepage opens on Einstein and a hello, then a collage of everything I keep
coming back to, laid over a painted Hidden Leaf that zooms as you scroll.

- Each entry is a markdown file in `src/content/commonplace/`; anything written
  below the frontmatter shows on its page at `/commonplace/<file-name>`. The
  schema, with comments, is in `src/content.config.ts`.
- The composition (order, size and material of each piece) is in
  `src/data/collage.ts`. Pieces sit on a dense grid and then lean and overlap;
  container queries scale them for phones.
- Works and talks come from `src/data/works.ts`, and blog posts are pulled in
  from `src/pages/blog/`.
- Music: `incipit` is the opening in [ABC notation](https://abcnotation.com),
  and each movement's `recording` takes a YouTube id with optional `start` and
  `end` seconds for trimming applause.
- Images: `astro build` downloads every remote image into
  `public/images/remote/` and serves those copies instead of hotlinking. Run
  `npm run images` and commit that folder to pin them for good.
