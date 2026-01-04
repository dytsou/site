import { Calendar, MapPin } from 'lucide-react';

interface EducationMetaProps {
  period: string;
  location: string;
}

export function EducationMeta({ period, location }: EducationMetaProps) {
  return (
    <div className="education-meta">
      <div className="education-meta-item">
        <Calendar className="education-meta-icon" />
        {period}
      </div>
      <div className="education-meta-item">
        <MapPin className="education-meta-icon" />
        {location}
      </div>
    </div>
  );
}
