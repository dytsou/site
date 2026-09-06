export type GitHubActivityRepo = {
  name: string;
  description: string;
  html_url: string;
  stargazers_count: number;
  language: string | null;
};

export const GITHUB_ACTIVITY_REPOS: GitHubActivityRepo[] = [
  {
    name: 'vaehor',
    description:
      'Self-hosted Google Drive explorer & media streaming platform with video player, 2FA, multi-language support, and modern UI. Built with Next.js 14 & TypeScript.',
    html_url: 'https://github.com/dytsou/vaehor',
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
    name: 'shorten-url',
    description: 'A modern, fast URL shortener built with Cloudflare Workers',
    html_url: 'https://github.com/dytsou/shorten-url',
    stargazers_count: 1,
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
    name: 'when2meet-to-gcal',
    description:
      'Tampermonkey userscript: on a when2meet, see the best continuous full-attendance windows and open a prefilled Google Calendar event.',
    html_url: 'https://github.com/dytsou/when2meet-to-gcal',
    stargazers_count: 1,
    language: 'JavaScript',
  },
  {
    name: 'resume',
    description:
      'A specialized web application that converts LaTeX resume documents to clean, professional HTML and deploys them to Cloudflare Pages.',
    html_url: 'https://github.com/dytsou/resume',
    stargazers_count: 0,
    language: 'JavaScript',
  },
];
