import { Github } from '../../icons/brandSocialIcons';

interface RepoCardHeaderProps {
  name: string;
}

export function RepoCardHeader({ name }: RepoCardHeaderProps) {
  return (
    <div className="repo-card-header">
      <h4 className="repo-card-title">{name}</h4>
      <Github className="repo-card-icon" />
    </div>
  );
}
