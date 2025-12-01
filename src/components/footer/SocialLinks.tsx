import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { FOOTER_SECTIONS } from './footerLinksConfig';
import './Footer.css';

interface SocialLinksComponentProps {
  isMobile?: boolean;
}

export function SocialLinksComponent({ isMobile = false }: SocialLinksComponentProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldShowToggle = isMobile;
  const isContentVisible = !isMobile || isExpanded;

  return (
    <div className={!isContentVisible ? 'footer-section-collapsed' : ''}>
      <h4 className="footer-section-title">
        {FOOTER_SECTIONS.connect.title}
        {shouldShowToggle && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="footer-section-toggle"
            aria-label={isExpanded ? 'Collapse section' : 'Expand section'}
          >
            {isExpanded ? (
              <ChevronUp className="footer-section-toggle-icon" />
            ) : (
              <ChevronDown className="footer-section-toggle-icon" />
            )}
          </button>
        )}
      </h4>
      <div className="footer-section-content">
        <div className="footer-social-container">
          {FOOTER_SECTIONS.connect.socialLinks.map((social, index) => {
            const Icon = social.icon;
            return (
              <a
                key={index}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-link"
                aria-label={social.label}
              >
                <Icon className="footer-social-icon" />
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}


