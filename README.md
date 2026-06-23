# Personal Portfolio

A modern, responsive personal portfolio website built with React, TypeScript, and Vite. This website showcases my projects, experience, and skills as a full-stack developer and computer science student at NYCU.

## Live Site

Visit the live portfolio at: [https://dy.tsou.me](https://dy.tsou.me)

## Tech Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Package Manager**: pnpm
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Deployment**: Cloudflare Pages

## Project Structure

```
src/
├── components/          # React components
│   ├── About.tsx       # About section
│   ├── Contact.tsx     # Contact form
│   ├── Experience.tsx  # Work experience
│   ├── Footer.tsx      # Footer component
│   ├── Hero.tsx        # Hero section
│   ├── Navigation.tsx  # Navigation bar
│   ├── Projects.tsx    # Projects showcase
│   └── ProjectCarousel.tsx # Project carousel
├── hooks/              # Custom React hooks
│   ├── useGitHub.ts    # GitHub API integration
│   └── useTheme.ts     # Dark/light theme toggle
├── types/              # TypeScript type definitions
└── lib/                # Utility functions
```

## Features

- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Dark/Light Mode**: Toggle between themes with persistent preference
- **GitHub Integration**: Real-time GitHub repository data and statistics
- **Smooth Animations**: CSS transitions and hover effects
- **Modern UI/UX**: Clean, professional design with gradient accents
- **SEO Optimized**: Meta tags and semantic HTML structure
- **Fast Performance**: Built with Vite for optimal loading speeds

## Getting Started

### Prerequisites

- Node.js 20 or higher
- pnpm 10 or higher

### Installation

```bash
# Clone the repository
git clone https://github.com/dytsou/site.git

# Navigate to the project directory
cd site

# Install dependencies
pnpm install
```

### Development

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Run type checking
pnpm typecheck

# Run linter
pnpm lint
```

## License

This project is open source and available under the [MIT License](LICENSE).
