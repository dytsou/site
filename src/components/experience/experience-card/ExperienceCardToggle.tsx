interface ExperienceCardToggleProps {
  isExpanded: boolean;
  onToggle: () => void;
}

export function ExperienceCardToggle({
  isExpanded,
  onToggle,
}: ExperienceCardToggleProps) {
  return (
    <button
      onClick={onToggle}
      className="experience-card-content-toggle"
      aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
    >
      {isExpanded ? 'See less' : 'See more'}
    </button>
  );
}
