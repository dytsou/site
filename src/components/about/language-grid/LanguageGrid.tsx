import { useState, useEffect } from 'react';
import '../About.css';
import { LanguageGridHeader } from './LanguageGridHeader';
import { LanguageGridList } from './LanguageGridList';

const LANGUAGES: { name: string; color: string }[] = [
  { name: 'Python', color: '#3572A5' },
  { name: 'C++', color: '#f34b7d' },
  { name: 'C', color: '#555555' },
  { name: 'Shell', color: '#89e051' },
  { name: 'JavaScript', color: '#f1e05a' },
  { name: 'Verilog', color: '#b2b7f8' },
  { name: 'Go', color: '#00ADD8' },
  { name: 'Cuda', color: '#3A4E3A' },
];

export function LanguageGrid() {
  const [isMobile, setIsMobile] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const shouldShowToggle = isMobile;
  const isContentVisible = !isMobile || isExpanded;

  return (
    <div className={`language-grid-container ${!isContentVisible ? 'language-grid-collapsed' : ''}`}>
      <div className="language-grid-card">
        <LanguageGridHeader
          shouldShowToggle={shouldShowToggle}
          isExpanded={isExpanded}
          onToggle={() => setIsExpanded(!isExpanded)}
        />
        <div className="language-grid-list-wrapper">
          <LanguageGridList languages={LANGUAGES} />
        </div>
      </div>
    </div>
  );
}
