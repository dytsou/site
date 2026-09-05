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
    name: 'homebrew-proximeeting',
    description: '',
    html_url: 'https://github.com/dytsou/homebrew-proximeeting',
    stargazers_count: 0,
    language: 'Ruby',
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
    name: 'ProxiMeeting',
    description:
      'A macOS menu bar app that shows your next meeting at a glance.',
    html_url: 'https://github.com/dytsou/ProxiMeeting',
    stargazers_count: 1,
    language: 'Swift',
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
    name: 'software-testing-hw3',
    description: 'HW3 of Software Testing Fall 2025 (S. K. Huang)',
    html_url: 'https://github.com/dytsou/software-testing-hw3',
    stargazers_count: 0,
    language: 'JavaScript',
  },
];
