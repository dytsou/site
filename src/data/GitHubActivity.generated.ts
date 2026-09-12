export type GitHubActivityRepo = {
  name: string;
  description: string;
  html_url: string;
  stargazers_count: number;
  language: string | null;
};

export const GITHUB_ACTIVITY_REPOS: GitHubActivityRepo[] = [
  {
    name: 'sdcBillook',
    description: 'A react billook created in SDC',
    html_url: 'https://github.com/dytsou/sdcBillook',
    stargazers_count: 0,
    language: 'JavaScript',
  },
  {
    name: 'intern-corner-scheduler',
    description:
      'A web interface using OR-Tools CP-SAT to generate round-table seating across rounds with fixed hosts, balanced tables, and pair-wise constraints.',
    html_url: 'https://github.com/dytsou/intern-corner-scheduler',
    stargazers_count: 0,
    language: 'Python',
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
    name: 'raycast-rsync-extension',
    description:
      'Transfer files between local and remote servers using rsync with SSH config integration',
    html_url: 'https://github.com/dytsou/raycast-rsync-extension',
    stargazers_count: 1,
    language: 'TypeScript',
  },
  {
    name: 'shorten-url',
    description: 'A modern, fast URL shortener built with Cloudflare Workers',
    html_url: 'https://github.com/dytsou/shorten-url',
    stargazers_count: 1,
    language: 'JavaScript',
  },
  {
    name: 'st2025',
    description: 'NYCU Software Testing Fall-2025 by S.K. Huang',
    html_url: 'https://github.com/dytsou/st2025',
    stargazers_count: 0,
    language: 'JavaScript',
  },
];
