/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {},
  },
  corePlugins: {
    fontSize: false, // Replaced by fluid type
  },
  plugins: [require("tailwindcss-fluid-type"), require("@tailwindcss/typography")],
};
