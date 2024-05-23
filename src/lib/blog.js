export const isDraft = ({ frontmatter }) => !!frontmatter.draft;
export const notDraft = (post) => !isDraft(post);
