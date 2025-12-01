import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { FooterLinkComponent } from './FooterLinks';
import { FOOTER_SECTIONS } from './footerLinksConfig';
import './Footer.css';

interface QuickLinksComponentProps {
  isMobile?: boolean;
}

export function QuickLinksComponent({ isMobile = false }: QuickLinksComponentProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldShowToggle = isMobile;
  const isContentVisible = !isMobile || isExpanded;

  return (
    <div className={!isContentVisible ? 'footer-section-collapsed' : ''}>
      <h4 className="footer-section-title">
        {FOOTER_SECTIONS.quickLinks.title}
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
        <ul className="footer-links">
          {FOOTER_SECTIONS.quickLinks.links.map((link, index) => (
            <li key={index}>
              <FooterLinkComponent link={link} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}


