import { ExternalLink, LucideIcon } from 'lucide-react';
import { Button } from '../ui/Button';
import './Hero.css';

interface HeroActionsProps {
  onViewWork: () => void;
  onGetInTouch: () => void;
}

export interface HeroActionType {
  label: string;
  url: string;
  variant: 'primary' | 'secondary' | 'outline';
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  external?: boolean;
}

const RESUME_ACTION: HeroActionType = {
  label: 'Resume',
  url: 'https://dy.tsou.me/resume',
  variant: 'secondary',
  icon: ExternalLink,
  iconPosition: 'right',
  external: true,
};

export function HeroActions({ onViewWork, onGetInTouch }: HeroActionsProps) {
  const handleResumeClick = () => {
    if (RESUME_ACTION.external) {
      window.open(RESUME_ACTION.url, '_blank');
    }
  };

  return (
    <div className="hero-actions">
      <Button onClick={onViewWork} variant="primary" size="lg">
        View My Work
      </Button>
      <Button onClick={onGetInTouch} variant="outline" size="lg">
        Get In Touch
      </Button>
      <Button
        onClick={handleResumeClick}
        variant={RESUME_ACTION.variant}
        size="lg"
        icon={RESUME_ACTION.icon}
        iconPosition={RESUME_ACTION.iconPosition}
      >
        {RESUME_ACTION.label}
      </Button>
    </div>
  );
}
