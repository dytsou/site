import { LanguageGridToggle } from './LanguageGridToggle';

interface LanguageGridHeaderProps {
  shouldShowToggle: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}

export function LanguageGridHeader({
  shouldShowToggle,
  isExpanded,
  onToggle,
}: LanguageGridHeaderProps) {
  return (
    <h5 className="language-grid-title">
      Most Used Languages
      {shouldShowToggle && (
        <LanguageGridToggle isExpanded={isExpanded} onToggle={onToggle} />
      )}
    </h5>
  );
}
