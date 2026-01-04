import { ExternalLink } from 'lucide-react';

interface ExperienceOrganizationProps {
  organization: string;
  orgUrl?: string;
  color: string;
}

export function ExperienceOrganization({
  organization,
  orgUrl,
  color,
}: ExperienceOrganizationProps) {
  return (
    <div className="experience-card-organization">
      <h3
        className={`experience-card-organization-title experience-card-organization-title-${color}`}
      >
        {organization}
      </h3>
      {orgUrl && (
        <a
          href={orgUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="experience-card-org-link"
          title="Visit organization website"
        >
          <ExternalLink className="experience-card-org-link-icon" />
        </a>
      )}
    </div>
  );
}
