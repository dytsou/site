export type GitHubActivityRepo = {
  name: string;
  description: string;
  html_url: string;
  stargazers_count: number;
  language: string | null;
};

export const GITHUB_ACTIVITY_REPOS: GitHubActivityRepo[] = [
  {
    name: 'site',
    description:
      'My personal website, which would be deploy to http://dy.tsou.me',
    html_url: 'https://github.com/dytsou/site',
    stargazers_count: 0,
    language: 'TypeScript',
  },
  {
    name: 'resume',
    description:
      'A specialized web application that converts LaTeX resume documents to clean, professional HTML and deploys them to Cloudflare Pages.',
    html_url: 'https://github.com/dytsou/resume',
    stargazers_count: 0,
    language: 'JavaScript',
  },
  {
    name: 'shorten-url',
    description: 'A modern, fast URL shortener built with Cloudflare Workers',
    html_url: 'https://github.com/dytsou/shorten-url',
    stargazers_count: 1,
    language: 'JavaScript',
  },
  {
    name: 'vaehor',
    description:
      'Self-hosted Google Drive explorer & media streaming platform with video player, 2FA, multi-language support, and modern UI. Built with Next.js 14 & TypeScript.',
    html_url: 'https://github.com/dytsou/vaehor',
    stargazers_count: 0,
    language: 'TypeScript',
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
    name: 'github-readme-stats',
    description:
      'Dynamically generated stats for GitHub READMEs with Cloudflare worker',
    html_url: 'https://github.com/dytsou/github-readme-stats',
    stargazers_count: 2,
    language: 'JavaScript',
  },
];
