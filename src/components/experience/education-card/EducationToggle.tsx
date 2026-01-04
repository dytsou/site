interface EducationToggleProps {
  isExpanded: boolean;
  onToggle: () => void;
}

export function EducationToggle({
  isExpanded,
  onToggle,
}: EducationToggleProps) {
  return (
    <button
      onClick={onToggle}
      className="education-highlights-toggle"
      aria-label={isExpanded ? 'Collapse highlights' : 'Expand highlights'}
    >
      {isExpanded ? 'See less' : 'See more'}
    </button>
  );
}
