interface Language {
  name: string;
  color: string;
}

interface LanguageItemProps {
  language: Language;
}

export function LanguageItem({ language }: LanguageItemProps) {
  return (
    <div className="language-item">
      <div
        className="language-dot"
        style={{ backgroundColor: language.color || '#9ca3af' }}
      />
      <div
        className={`language-name ${language.name.length > 10 ? 'language-name-xs' : 'language-name-sm'}`}
      >
        {language.name}
      </div>
    </div>
  );
}
