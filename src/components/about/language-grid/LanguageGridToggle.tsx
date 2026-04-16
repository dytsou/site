import { ChevronDown, ChevronUp } from 'lucide-react';

interface LanguageGridToggleProps {
  isExpanded: boolean;
  onToggle: () => void;
}

export function LanguageGridToggle({
  isExpanded,
  onToggle,
}: LanguageGridToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="language-grid-toggle"
      aria-label={isExpanded ? 'Collapse languages' : 'Expand languages'}
    >
      {isExpanded ? (
        <ChevronUp className="language-grid-toggle-icon" />
      ) : (
        <ChevronDown className="language-grid-toggle-icon" />
      )}
    </button>
  );
}
