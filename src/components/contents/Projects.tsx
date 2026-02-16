export const PROJECTS_CONTENTS = [
  {
    id: '1',
    title: 'SDC Core System',
    description:
      'Backend infrastructure for NYCU Software Development Club. Built a robust RESTful API system with Go, featuring Docker containerization and PostgreSQL database management.',
    short_description:
      'Backend infrastructure for Software Development Club with Go, Docker, and PostgreSQL',
    technologies: ['Go', 'RESTful API', 'Docker', 'PostgreSQL'],
    github_url: 'https://github.com/NYCU-SDC/core-system-backend',
    image_url:
      'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=800',
    featured: true,
    order_index: 2,
  },
  {
    id: '2',
    title: 'Koreji',
    description:
      'A time management application that helps you efficiently collect and accumulate spare time. Built with React Native and Expo, enabling cross-platform mobile development. Transform time spent commuting, waiting, or between tasks into productive work, learning, or personal activities.',
    short_description:
      'Time management app built with React Native and Expo for efficient spare time utilization',
    technologies: ['React Native', 'Expo', 'TypeScript', 'Mobile Development'],
    github_url: 'https://github.com/kore-ji/koreji-frontend',
    image_url:
      'https://images.pexels.com/photos/5952647/pexels-photo-5952647.jpeg?auto=compress&cs=tinysrgb&w=800',
    featured: true,
    order_index: 1,
  },
  {
    id: '3',
    title: 'CAIender',
    description:
      'AI-powered calendar platform built during MC Hackathon 2025. Leverages React.js and Vite for a responsive frontend, GraphQL for efficient data queries, and integrates with LLM for intelligent scheduling.',
    short_description:
      'AI calendar platform with React.js, GraphQL, and LLM integration',
    technologies: ['React.js', 'Vite', 'GraphQL', 'DynamoDB', 'LLM'],
    github_url: 'https://github.com/MCHackathon2025/CAIender-frontend',
    image_url:
      'https://images.pexels.com/photos/5952647/pexels-photo-5952647.jpeg?auto=compress&cs=tinysrgb&w=800',
    featured: true,
    order_index: 3,
  },
  {
    id: '4',
    title: 'Shorten URL',
    description:
      'A modern, fast URL shortener built with Cloudflare Workers. Provides efficient URL shortening and redirection with edge computing capabilities for low latency and global distribution.',
    short_description:
      'Modern URL shortener built with Cloudflare Workers for fast edge computing',
    technologies: ['JavaScript', 'Cloudflare Workers', 'Edge Computing'],
    github_url: 'https://github.com/dytsou/shorten-url',
    image_url:
      'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=800',
    featured: false,
    order_index: 4,
  },
  {
    id: '5',
    title: 'Dungeon',
    description:
      'Text-based adventure game showcasing object-oriented programming principles in C++. Features procedural dungeon generation, inventory management, and combat system.',
    short_description: 'Text-based adventure game in C++',
    technologies: ['C++', 'Game Development', 'OOP'],
    github_url: 'https://github.com/dytsou/Dungeon',
    image_url:
      'https://images.pexels.com/photos/5952647/pexels-photo-5952647.jpeg?auto=compress&cs=tinysrgb&w=800',
    featured: false,
    order_index: 5,
  },
  {
    id: '6',
    title: 'Resume Builder',
    description:
      'A specialized web application that converts LaTeX resume documents to clean, professional HTML and deploys them to GitHub Pages. Streamlines the resume creation and deployment process.',
    short_description:
      'LaTeX to HTML resume converter with GitHub Pages deployment',
    technologies: ['JavaScript', 'LaTeX', 'HTML', 'GitHub Pages'],
    github_url: 'https://github.com/dytsou/resume',
    image_url:
      'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=800',
    featured: false,
    order_index: 6,
  },
  {
    id: '7',
    title: 'GitHub Readme Stats',
    description:
      'Dynamically generated stats for GitHub READMEs using Cloudflare Workers. Provides customizable GitHub profile statistics and badges with edge computing performance.',
    short_description:
      'Dynamic GitHub README stats generator with Cloudflare Workers',
    technologies: ['JavaScript', 'Cloudflare Workers', 'GitHub API'],
    github_url: 'https://github.com/dytsou/github-readme-stats',
    image_url:
      'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=800',
    featured: false,
    order_index: 7,
  },
  {
    id: '8',
    title: 'Raycast Rsync Extension',
    description:
      'Transfer files between local and remote servers using rsync with SSH config integration. A Raycast extension that simplifies file synchronization workflows.',
    short_description:
      'Raycast extension for rsync file transfers with SSH config integration',
    technologies: ['TypeScript', 'Raycast', 'rsync', 'SSH'],
    github_url: 'https://github.com/dytsou/raycast-rsync-extension',
    image_url:
      'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=800',
    featured: false,
    order_index: 8,
  },
  {
    id: '9',
    title: 'Intern Corner Scheduler',
    description:
      'A web interface using OR-Tools CP-SAT to generate round-table seating across rounds with fixed hosts, balanced tables, and pair-wise constraints. Optimizes seating arrangements for events.',
    short_description:
      'Round-table seating scheduler using OR-Tools CP-SAT optimization',
    technologies: ['Python', 'OR-Tools', 'CP-SAT', 'Optimization'],
    github_url: 'https://github.com/dytsou/intern-corner-scheduler',
    image_url:
      'https://images.pexels.com/photos/5952647/pexels-photo-5952647.jpeg?auto=compress&cs=tinysrgb&w=800',
    featured: false,
    order_index: 9,
  },
  {
    id: '10',
    title: 'BallQuest720',
    description:
      'Immersive 3D ball-catching game developed in C++ with OpenGL. Features advanced graphics rendering, physics simulation, and dynamic difficulty adjustment.',
    short_description: '3D ball-catching game with C++ and OpenGL',
    technologies: ['C++', 'OpenGL', 'Game Development'],
    github_url: 'https://github.com/dytsou/BallQuest720',
    image_url:
      'https://images.pexels.com/photos/163432/basketball-dunk-blue-game-163432.jpeg?auto=compress&cs=tinysrgb&w=800',
    featured: false,
    order_index: 10,
  },
];
