// Things I've made or said, outside the blog. Shared by the homepage timeline
// and the commonplace collages.

export interface Work {
    date: Date;
    title: string;
    description?: string;
    link?: { href: string; text: string };
    youtube?: string;
}

export const works: Work[] = [
    {
        date: new Date("Jun 29, 2023"),
        title: "Broad Applications of Language Generation",
        description:
            "Spoke about artificial intelligence and gave a demonstration of Legislaide.",
        youtube: "D4lCzCLSO-s",
    },
    {
        date: new Date("Jun 16, 2026"),
        title: "The Grading Conference Essays",
        description: "A few essays inspired by The Grading Conference",
        link: { href: "/grading-conf-26", text: "Read" },
    },
    {
        date: new Date("Sep 05, 2022"),
        title: "FunOV - Functional validation library for Typescript",
        description: "Mostly replaced by Zod etc. but useful in niche cases.",
        link: { href: "https://github.com/pujitm/fun-ov", text: "GitHub" },
    },
    {
        date: new Date("Feb 12, 2022"),
        title: "Git Ice",
        description: "Interactive CLI to standardize commit messages in teams.",
        link: { href: "https://github.com/pujitm/git-ice", text: "GitHub" },
    },
    {
        date: new Date("Oct 29, 2025"),
        title: "Unraid API",
        description:
            "Core developer of the Unraid API, the central admin API for Unraid OS.",
        link: { href: "https://github.com/unraid/api", text: "GitHub" },
    },
    {
        date: new Date("Jan 13, 2024"),
        title: "Legislaide - AI for drafting local gov policy",
        description:
            "Built a policy-writing product for governments based on GPT-4. Was used in Denver and Massachusetts.",
        link: { href: "https://www.legislaide.com/", text: "Website" },
    },
];
