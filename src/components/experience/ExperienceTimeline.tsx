import { ExperienceCard } from './experience-card/ExperienceCard';
import './Experience.css';
import { Experience } from './types';

interface ExperienceTimelineProps {
  experiences: Experience[];
}

export function ExperienceTimeline({ experiences }: ExperienceTimelineProps) {
  return (
    <div className="experience-timeline">
      <div className="experience-timeline-line"></div>
      <div className="experience-timeline-items">
        {experiences.map((exp, index) => (
          <div
            key={`${exp.organization ?? 'experience'}-${exp.period ?? index}`}
            className="animate-fade-in"
            style={{ animationDelay: `${index * 70}ms` }}
          >
            <ExperienceCard experience={exp} />
          </div>
        ))}
      </div>
    </div>
  );
}
