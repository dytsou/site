import { useState, useEffect } from 'react';
import '../Experience.css';
import { ExperienceCardDot } from './ExperienceCardDot';
import { ExperienceOrganization } from './ExperienceOrganization';
import { ExperienceMeta } from './ExperienceMeta';
import { ExperienceDescription } from './ExperienceDescription';
import { ExperiencePosts } from './ExperiencePosts';
import { ExperienceCardToggle } from './ExperienceCardToggle';
import { Experience } from '../types';

interface ExperienceCardProps {
  experience: Experience;
}

export function ExperienceCard({ experience }: ExperienceCardProps) {
  const Icon = experience.icon;
  const [isMobile, setIsMobile] = useState(false);
  const [isContentExpanded, setIsContentExpanded] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const shouldShowToggle = isMobile && (experience.description.length > 0 || (experience.posts && experience.posts.length > 0));
  const isContentVisible = !isMobile || isContentExpanded;

  return (
    <div className="experience-card">
      <ExperienceCardDot Icon={Icon} color={experience.color} isMobile={isMobile} />

      <div className={`experience-card-content experience-card-bg-${experience.color}`}>
        <div className="experience-card-header">
          {!isMobile && (
            <div className="experience-card-icon-container">
              <Icon className={`experience-card-icon experience-card-icon-${experience.color}`} />
            </div>
          )}
          <div className="experience-card-info">
            <ExperienceOrganization
              organization={experience.organization}
              orgUrl={experience.orgUrl}
              color={experience.color}
            />
            <div className="experience-card-title">
              {experience.title}
            </div>
            <ExperienceMeta period={experience.period} location={experience.location} />

            <div className={isContentVisible ? 'experience-card-content-wrapper' : 'experience-card-content-wrapper collapsed'}>
              <ExperienceDescription description={experience.description} color={experience.color} />
              {experience.posts && <ExperiencePosts posts={experience.posts} />}
            </div>

            {shouldShowToggle && (
              <ExperienceCardToggle
                isExpanded={isContentExpanded}
                onToggle={() => setIsContentExpanded(!isContentExpanded)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
