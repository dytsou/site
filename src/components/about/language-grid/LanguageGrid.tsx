import { useState, useEffect } from 'react';
import { useAppSelector } from '../../../store/hooks';
import '../About.css';
import { LanguageGridHeader } from './LanguageGridHeader';
import { LanguageGridList } from './LanguageGridList';
import { FALLBACK_LANGUAGES } from './Languages.generated';

const LANGUAGE_COLORS: Record<string, string> = Object.fromEntries(
  FALLBACK_LANGUAGES.map((l) => [l.name, l.color])
);

export function LanguageGrid() {
  const topLanguages = useAppSelector((state) => state.github.topLanguages);
  const languagesLoading = useAppSelector(
    (state) => state.github.languagesLoading
  );
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
  const resolvedLanguages =
    topLanguages?.map((l) => ({
      name: l.name,
      color: LANGUAGE_COLORS[l.name] ?? 'var(--accent)',
    })) ?? FALLBACK_LANGUAGES;

  return (
    <div
      className={`language-grid-container ${!isContentVisible ? 'language-grid-collapsed' : ''}`}
    >
      <div className="language-grid-card">
        <LanguageGridHeader
          shouldShowToggle={shouldShowToggle}
          isExpanded={isExpanded}
          onToggle={() => setIsExpanded(!isExpanded)}
        />
        <div className="language-grid-list-wrapper">
          <LanguageGridList languages={resolvedLanguages} />
          {languagesLoading && (
            <div className="mt-3 text-xs text-[color:var(--text-muted)]">
              Loading from GitHub…
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
