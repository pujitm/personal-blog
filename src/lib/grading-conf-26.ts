export const posterUrl =
  "https://docs.google.com/presentation/d/1y4jAfBm8XVSH0OIO-Lng9KiDSItrkRyFKN2p0tGAats/edit?usp=sharing";

type GradingConferenceFrontmatter = {
  number: number;
  slug: string;
  abstractTitle: string;
  author: string;
  abstract: string[];
};

type GradingConferenceEssayModule = {
  Content: unknown;
  frontmatter: GradingConferenceFrontmatter;
};

const essayModules = import.meta.glob<GradingConferenceEssayModule>(
  "../data/grading-conf-26/*.md",
  { eager: true }
);

export const essays = Object.values(essayModules)
  .map((essayModule) => ({
    ...essayModule.frontmatter,
    Content: essayModule.Content,
  }))
  .sort((a, b) => a.number - b.number);

export type GradingConferenceEssay = (typeof essays)[number];
