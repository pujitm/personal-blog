import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

import tailwind from "@astrojs/tailwind";
import selfHostImages from "./integrations/self-host-images.mjs";

// https://astro.build/config
export default defineConfig({
  site: "https://pujitm.xyz",
  vite: {
    ssr: {
      external: ["svgo"],
    },
  },
  integrations: [selfHostImages(), mdx(), sitemap(), tailwind()],
});
