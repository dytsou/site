export interface GitHubRepo {
  name: string;
  description: string;
  html_url: string;
  stargazers_count: number;
  language: string | null;
  topics: string[];
  fork: boolean;
  languages_url: string;
  owner: {
    login: string;
  };
  private?: boolean;
}

export interface GitHubStats {
  public_repos: number;
  followers: number;
  following: number;
}

export type Theme = 'light' | 'dark';

export type { Project, ProjectSource } from './projects';
