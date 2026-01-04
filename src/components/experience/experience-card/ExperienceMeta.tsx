import { Calendar, MapPin } from 'lucide-react';

interface ExperienceMetaProps {
  period: string;
  location: string;
}

export function ExperienceMeta({ period, location }: ExperienceMetaProps) {
  return (
    <div className="experience-card-meta">
      <div className="experience-card-meta-item">
        <Calendar className="experience-card-meta-icon" />
        {period}
      </div>
      <div className="experience-card-meta-item">
        <MapPin className="experience-card-meta-icon" />
        {location}
      </div>
    </div>
  );
}
