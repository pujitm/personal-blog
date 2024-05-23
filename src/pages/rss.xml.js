import rss from "@astrojs/rss";
import { SITE_TITLE, SITE_DESCRIPTION } from "../config";

export const GET = () =>
  rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: import.meta.env.SITE,
    items: import.meta.glob("./blog/**/*.md"),
    stylesheet: "/rss/styles.xsl",
  });
