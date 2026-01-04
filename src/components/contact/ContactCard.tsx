import { useState, useEffect } from 'react';
import './Contact.css';
import { LucideIcon } from 'lucide-react';

interface ContactCardProps {
  platform: 'linkedin' | 'github' | 'email';
  title: string;
  subtitle: string;
  url: string;
  icon: LucideIcon;
}

export function ContactCard({
  platform,
  title,
  subtitle,
  url,
  icon: Icon,
}: ContactCardProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (isMobile) {
    return (
      <div className="contact-card-mobile">
        <a
          href={url}
          target={platform === 'email' ? undefined : '_blank'}
          rel={platform === 'email' ? undefined : 'noopener noreferrer'}
          className={`contact-card-icon-link contact-card-icon contact-card-icon-${platform} group`}
        >
          <Icon className="contact-card-icon-svg" />
        </a>
        <div className="contact-card-content">
          <div className="contact-card-title">{title}</div>
        </div>
      </div>
    );
  }

  return (
    <a
      href={url}
      target={platform === 'email' ? undefined : '_blank'}
      rel={platform === 'email' ? undefined : 'noopener noreferrer'}
      className={`contact-card contact-card-${platform} group`}
    >
      <div className={`contact-card-icon contact-card-icon-${platform}`}>
        <Icon className="contact-card-icon-svg" />
      </div>
      <div className="contact-card-content">
        <div className="contact-card-title">{title}</div>
        <div
          className={`contact-card-subtitle contact-card-subtitle-${platform}`}
        >
          {subtitle}
        </div>
      </div>
    </a>
  );
}
