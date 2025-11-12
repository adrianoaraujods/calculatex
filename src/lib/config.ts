export const THEMES = ["system", "light", "dark"] as const;
export type Theme = (typeof THEMES)[number];

export const GITHUB_OWNER = "adrianoaraujods";
export const GITHUB_REPO = "calculatex";
export const GITHUB_BRANCH = "master";
export const GITHUB_URL = `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}`;
