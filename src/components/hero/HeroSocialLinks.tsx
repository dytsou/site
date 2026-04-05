import { Mail, Calendar, Send } from 'lucide-react';
import { Github, Linkedin } from '../icons/brandSocialIcons';
import { IconButton } from '../ui/IconButton';
import './Hero.css';

export const HeroSocialLinks = () => {
  return (
    <div className="hero-social-links">
      <IconButton
        icon={Github}
        variant="ghost"
        size="lg"
        onClick={() => window.open('https://github.com/dytsou', '_blank')}
        aria-label="GitHub"
      />
      <IconButton
        icon={Linkedin}
        variant="primary"
        size="lg"
        onClick={() =>
          window.open('https://www.linkedin.com/in/dytsou/', '_blank')
        }
        aria-label="LinkedIn"
      />
      <IconButton
        icon={Mail}
        variant="outline"
        size="lg"
        onClick={() => window.open('mailto:contact@dy.tsou.me', '_blank')}
        aria-label="Email"
      />
      <IconButton
        icon={Send}
        variant="secondary"
        size="lg"
        onClick={() => window.open('https://t.me/dytsou', '_blank')}
        aria-label="Telegram"
      />
      <IconButton
        icon={Calendar}
        variant="outline"
        size="lg"
        onClick={() => window.open('https://dy.tsou.me/cal', '_blank')}
        aria-label="Calendar"
      />
    </div>
  );
};
