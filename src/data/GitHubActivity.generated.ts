export type GitHubActivityRepo = {
  name: string;
  description: string;
  html_url: string;
  stargazers_count: number;
  language: string | null;
};

export const GITHUB_ACTIVITY_REPOS: GitHubActivityRepo[] = [
  {
    name: 'dytsou.github.io',
    description: 'My personal website',
    html_url: 'https://github.com/dytsou/dytsou.github.io',
    stargazers_count: 0,
    language: 'HTML',
  },
  {
    name: 'site',
    description:
      'My personal website, which would be deploy to http://dy.tsou.me',
    html_url: 'https://github.com/dytsou/site',
    stargazers_count: 0,
    language: 'CSS',
  },
  {
    name: 'venn2meet',
    description: '',
    html_url: 'https://github.com/dytsou/venn2meet',
    stargazers_count: 0,
    language: 'TypeScript',
  },
  {
    name: 'sdcBillook',
    description: 'A react billook created in SDC',
    html_url: 'https://github.com/dytsou/sdcBillook',
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
  {
    name: 'intern-corner-scheduler',
    description:
      'A web interface using OR-Tools CP-SAT to generate round-table seating across rounds with fixed hosts, balanced tables, and pair-wise constraints.',
    html_url: 'https://github.com/dytsou/intern-corner-scheduler',
    stargazers_count: 0,
    language: 'Python',
  },
];
