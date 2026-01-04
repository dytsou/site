import { LanguageItem } from './LanguageItem';

interface Language {
  name: string;
  color: string;
}

interface LanguageGridListProps {
  languages: Language[];
}

export function LanguageGridList({ languages }: LanguageGridListProps) {
  return (
    <div className="language-grid-list">
      {languages.map((lang) => (
        <LanguageItem key={lang.name} language={lang} />
      ))}
    </div>
  );
}
