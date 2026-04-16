export interface Project {
  id: string;
  title: string;
  description: string;
  technologies?: string[];
  tags?: string[];
  github_url?: string;
  featured?: boolean;
}

export interface ProjectSource {
  url: string;
  featured?: boolean;
  title?: string;
  description?: string;
  technologies?: string[];
  tags?: string[];
}
