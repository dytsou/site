import { ExperiencePostItem } from './ExperiencePostItem';
import { Post } from '../types';

interface ExperiencePostsProps {
  posts: Post[];
}

export function ExperiencePosts({ posts }: ExperiencePostsProps) {
  if (!posts || posts.length === 0) return null;

  return (
    <div className="experience-posts">
      <div className="experience-posts-list">
        {posts.map((post, idx) => (
          <ExperiencePostItem key={idx} post={post} />
        ))}
      </div>
    </div>
  );
}
