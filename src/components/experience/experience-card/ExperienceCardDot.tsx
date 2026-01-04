import { LucideIcon } from 'lucide-react';

interface ExperienceCardDotProps {
  Icon: LucideIcon;
  color: string;
  isMobile: boolean;
}

export function ExperienceCardDot({
  Icon,
  color,
  isMobile,
}: ExperienceCardDotProps) {
  return (
    <div className={`experience-card-dot experience-card-dot-${color}`}>
      {isMobile && (
        <Icon
          className={`experience-card-dot-icon experience-card-dot-icon-${color}`}
        />
      )}
    </div>
  );
}
