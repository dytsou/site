/** Devicon slug per GitHub language name (for About language grid logos). */

const LANGUAGE_ICON_SLUGS: Record<string, string> = {
  JavaScript: 'javascript',
  TypeScript: 'typescript',
  Python: 'python',
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

export type LanguageIcon = { kind: 'img'; src: string } | { kind: 'terminal' };

export function languageIcon(name: string): LanguageIcon | null {
  // Devicon bash mark is near-black and disappears on dark surfaces — use a terminal glyph instead
  if (name === 'Shell') return { kind: 'terminal' };

  const slug = LANGUAGE_ICON_SLUGS[name];
  if (!slug) return null;
  return {
    kind: 'img',
    // pin version so logos don't silently change
    src: `https://cdn.jsdelivr.net/gh/devicons/devicon@2.16.0/icons/${slug}/${slug}-original.svg`,
  };
}
