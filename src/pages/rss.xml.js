import rss, { pagesGlobToRssItems } from "@astrojs/rss";
import { SITE_TITLE, SITE_DESCRIPTION } from "../config";
import { notDraft } from "../lib/blog";
const blogStuff = import.meta.glob("./blog/**/*.md");

export const GET = async (context) =>
  rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: context.site || import.meta.env.SITE,
    items: await pagesGlobToRssItems(blogStuff),
    stylesheet: "/rss/styles.xsl",
  });
