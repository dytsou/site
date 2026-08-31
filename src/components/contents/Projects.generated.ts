import type { Project } from '../../types/projects';

export const PROJECTS_CONTENTS: Project[] = [
  {
    id: 'kore-ji/koreji-frontend',
    title: 'Koreji',
    description:
      "Koreji helps you efficiently collect and accumulate spare time. Easily transform time spent commuting, waiting, or in between tasks into tangible steps forward—whether that's work, learning, or personal projects.",
    technologies: ['TypeScript', 'JavaScript'],
    tags: ['time-management', 'productivity', 'mobile-app'],
    github_url: 'https://github.com/kore-ji/koreji-frontend',
    featured: true,
  },
  {
    id: 'NYCU-SDC/core-system-backend',
    title: 'SDC Core System',
    description:
      'Backend infrastructure for NYCU Software Development Club. Built a robust RESTful API system with Go, featuring Docker containerization and PostgreSQL database management.',
    technologies: ['Go', 'Shell', 'Makefile', 'Dockerfile'],
    tags: ['erp', 'golang-system', 'rest-api', 'docker', 'postgresql'],
    github_url: 'https://github.com/NYCU-SDC/core-system-backend',
    featured: true,
  },
  {
    id: 'dytsou/ProxiMeeting',
    title: 'ProxiMeeting',
    description:
      'A macOS menu bar app that shows your next meeting at a glance.',
    technologies: ['Swift', 'Shell', 'Makefile'],
    tags: [
      'calendar',
      'google-meet',
      'macos',
      'meeting',
      'menu-bar-app',
      'microsoft-teams',
      'webex',
      'whereby',
      'zoom',
    ],
    github_url: 'https://github.com/dytsou/ProxiMeeting',
    featured: true,
  },
  {
    id: 'dytsou/vaehor',
    title: 'Vaehor',
    description:
      'Self-hosted Google Drive explorer & media streaming platform with video player, 2FA, multi-language support, and modern UI. Built with Next.js 14 & TypeScript.',
    technologies: ['TypeScript', 'CSS', 'JavaScript', 'Shell'],
    tags: ['google-drive', 'media-streaming', 'nextjs', 'self-hosted'],
    github_url: 'https://github.com/dytsou/vaehor',
    featured: true,
  },
  {
    id: 'MCHackathon2025/CAIender-frontend',
    title: 'CAIender',
    description:
      'The project, called CAIendar, is designed as an AI Calendar × Life Designer to enhance workplace experience by providing personalized scheduling and activity recommendations',
    technologies: ['JavaScript', 'CSS', 'HTML'],
    tags: ['ai', 'helper', 'hackathon'],
    github_url: 'https://github.com/MCHackathon2025/CAIender-frontend',
    featured: true,
  },
  {
    id: 'dytsou/github-readme-stats',
    title: 'GitHub README Stats',
    description:
      'Dynamically generated stats for GitHub READMEs with Cloudflare worker',
    technologies: ['JavaScript', 'TypeScript', 'Shell'],
    tags: [
      'cloudflare-workers',
      'github-readme-stats',
      'profile',
      'readme',
      'readme-profile-badge',
    ],
    github_url: 'https://github.com/dytsou/github-readme-stats',
    featured: true,
  },
  {
    id: 'dytsou/when2meet-to-gcal',
    title: 'When2meet to Google Calendar',
    description:
      'Tampermonkey userscript: on a when2meet, see the best continuous full-attendance windows and open a prefilled Google Calendar event.',
    technologies: ['JavaScript'],
    tags: [],
    github_url: 'https://github.com/dytsou/when2meet-to-gcal',
    featured: false,
  },
  {
    id: 'dytsou/shorten-url',
    title: 'Shorten URL',
    description: 'A modern, fast URL shortener built with Cloudflare Workers',
    technologies: ['JavaScript'],
    tags: ['cloudflare-workers', 'shorten-urls'],
    github_url: 'https://github.com/dytsou/shorten-url',
    featured: false,
  },
  {
    id: 'dytsou/raycast-rsync-extension',
    title: 'Raycast Rsync Extension',
    description:
      'Transfer files between local and remote servers using rsync with SSH config integration',
    technologies: ['TypeScript', 'JavaScript'],
    tags: ['raycast-extension', 'rsync', 'transfer-files'],
    github_url: 'https://github.com/dytsou/raycast-rsync-extension',
    featured: false,
  },
  {
    id: 'dytsou/claude-code-notify',
    title: 'Claude Code Notify',
    description:
      'Interactive approval notifications for Claude Code permission requests',
    technologies: ['Python', 'Shell', 'Makefile'],
    tags: ['claude-code', 'notification-service'],
    github_url: 'https://github.com/dytsou/claude-code-notify',
    featured: false,
  },
  {
    id: 'dytsou/Dungeon',
    title: 'Dungeon',
    description:
      'A text-based dungeon adventure game where players explore rooms, fight monsters, and manage resources to reach the boss room.',
    technologies: ['C++', 'Makefile'],
    tags: ['dungeons-and-dragons', 'text-based', 'game'],
    github_url: 'https://github.com/dytsou/Dungeon',
    featured: false,
  },
  {
    id: 'dytsou/resume',
    title: 'Resume Builder',
    description:
      'A specialized web application that converts LaTeX resume documents to clean, professional HTML and deploys them to Cloudflare Pages.',
    technologies: ['JavaScript', 'TeX', 'CSS', 'TypeScript'],
    tags: ['html-converter', 'node-js', 'resume-builder'],
    github_url: 'https://github.com/dytsou/resume',
    featured: false,
  },
  {
    id: 'dytsou/intern-corner-scheduler',
    title: 'Intern Corner Scheduler',
    description:
      'A web interface using OR-Tools CP-SAT to generate round-table seating across rounds with fixed hosts, balanced tables, and pair-wise constraints.',
    technologies: ['Python', 'JavaScript', 'CSS', 'Makefile'],
    tags: ['round-table', 'scheduler'],
    github_url: 'https://github.com/dytsou/intern-corner-scheduler',
    featured: false,
  },
] as Project[];
