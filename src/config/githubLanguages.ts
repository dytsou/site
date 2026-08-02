export const EXCLUDED_GITHUB_LANGUAGES = [
  'Jupyter Notebook',
  'CMake',
  'TeX',
] as const;

/** Same query as the About “Most Used Languages” github-readme-stats card. */
export const GITHUB_TOP_LANGS_URL =
  'https://github-readme-stats.tsou.me/api/top-langs/?username=dytsou&hide=jupyter%20notebook,cmake,tex&langs_count=8&size_weight=0.4&count_weight=0.6&hide_progress=true&theme=tokyonight';
