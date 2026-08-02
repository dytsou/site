/** Devicon slug per GitHub language name (for About language grid logos). */

const LANGUAGE_ICON_SLUGS: Record<string, string> = {
  JavaScript: 'javascript',
  TypeScript: 'typescript',
  Python: 'python',
  Shell: 'bash',
  CSS: 'css3',
  C: 'c',
  'C++': 'cplusplus',
  Go: 'go',
  HTML: 'html5',
  Rust: 'rust',
  Ruby: 'ruby',
  Java: 'java',
  Kotlin: 'kotlin',
  Swift: 'swift',
};

export function languageIconUrl(name: string): string | null {
  const slug = LANGUAGE_ICON_SLUGS[name];
  if (!slug) return null;
  // pin version so logos don't silently change
  return `https://cdn.jsdelivr.net/gh/devicons/devicon@2.16.0/icons/${slug}/${slug}-original.svg`;
}
