export const THEMES = ["system", "light", "dark"] as const;
export type Theme = (typeof THEMES)[number];

export const GITHUB_OWNER = "adrianoaraujods";
export const GITHUB_REPO = "calc2";
export const GITHUB_BRANCH = "master";
export const GITHUB_URL = `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}`;
