export type GitHubActivityRepo = {
  name: string;
  description: string;
  html_url: string;
  stargazers_count: number;
  language: string | null;
};

export const GITHUB_ACTIVITY_REPOS: GitHubActivityRepo[] = [
  {
    name: 'resume',
    description:
      'A specialized web application that converts LaTeX resume documents to clean, professional HTML and deploys them to GitHub Pages.',
    html_url: 'https://github.com/dytsou/resume',
    stargazers_count: 0,
    language: 'JavaScript',
  },
  {
    name: 'cal',
    description:
      'A simple calendar application that displays multiple calendar feeds using Open Web Calendar.',
    html_url: 'https://github.com/dytsou/cal',
    stargazers_count: 0,
    language: 'JavaScript',
  },
  {
    name: 'static-page-template',
    description:
      'Template for static pages on dy.tsou.me via cloudflare-subpath-deploy',
    html_url: 'https://github.com/dytsou/static-page-template',
    stargazers_count: 0,
    language: 'HTML',
  },
  {
    name: 'site',
    description:
      'My personal website, which would be deploy to http://dy.tsou.me',
    html_url: 'https://github.com/dytsou/site',
    stargazers_count: 0,
    language: 'TypeScript',
  },
  {
    name: 'cloudflare-subpath-deploy-playground',
    description: '',
    html_url: 'https://github.com/dytsou/cloudflare-subpath-deploy-playground',
    stargazers_count: 0,
    language: null,
  },
  {
    name: 'cloudflare-subpath-deploy',
    description: '',
    html_url: 'https://github.com/dytsou/cloudflare-subpath-deploy',
    stargazers_count: 0,
    language: 'JavaScript',
  },
];
