import { useState, useEffect } from 'react';
import '../Experience.css';
import { EducationIcon } from './EducationIcon';
import { EducationInstitution } from './EducationInstitution';
import { EducationMeta } from './EducationMeta';
import { EducationHighlights } from './EducationHighlights';
import { EducationToggle } from './EducationToggle';

interface Education {
  degree: string;
  institution: string;
  period: string;
  location: string;
  highlights: string[];
}

interface EducationCardProps {
  education: Education;
}

export function EducationCard({ education }: EducationCardProps) {
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
    <div className="education-card">
      <div className="education-card-content">
        <EducationIcon />
        <div className="education-info">
          <EducationInstitution
            institution={education.institution}
            degree={education.degree}
          />
          <EducationMeta period={education.period} location={education.location} />
          
          <div className={isContentVisible ? 'education-highlights-wrapper' : 'education-highlights-wrapper collapsed'}>
            <EducationHighlights highlights={education.highlights} />
          </div>
          
          {shouldShowToggle && (
            <EducationToggle
              isExpanded={isExpanded}
              onToggle={() => setIsExpanded(!isExpanded)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
