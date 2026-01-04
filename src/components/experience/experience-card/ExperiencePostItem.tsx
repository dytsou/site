import { ExternalLink } from 'lucide-react';
import { Post } from '../types';

interface ExperiencePostItemProps {
  post: Post;
}

export function ExperiencePostItem({ post }: ExperiencePostItemProps) {
  return (
    <a
      href={post.url}
      target="_blank"
      rel="noopener noreferrer"
      className="experience-post-link group"
    >
      <div className="experience-post-content">
        <div className="experience-post-title">{post.title}</div>
        {post.subtitle && (
          <div className="experience-post-subtitle">{post.subtitle}</div>
        )}
        <div className="experience-post-meta">
          <div className="experience-post-date">{post.date}</div>
          {post.orgUrl && (
            <>
              <span className="experience-post-separator">•</span>
              <span className="experience-post-org-label">Organization</span>
            </>
          )}
        </div>
      </div>
      <ExternalLink className="experience-post-icon" />
    </a>
  );
}
