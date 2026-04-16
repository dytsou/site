export interface GitHubRepo {
  name: string;
  description: string;
  html_url: string;
  stargazers_count: number;
  language: string;
  topics: string[];
}

export interface GitHubStats {
  public_repos: number;
  followers: number;
  following: number;
}

export type Theme = 'light' | 'dark';

export type { Project, ProjectSource } from './projects';
