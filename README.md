# Personal Portfolio

A static personal portfolio at [dy.tsou.me](https://dy.tsou.me), built with Astro and React islands. The site showcases projects, experience, and contact info for a full-stack developer and computer science student at NYCU.

## Tech Stack

- **Framework**: [Astro 6](https://astro.build) (static output) with `@astrojs/react` islands
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Icons**: Lucide React
- **Package manager**: pnpm
- **Deployment**: Cloudflare Pages via Wrangler

## Features

- Multi-page routing (`/`, `/about`, `/experiences`, `/projects`, `/contact`)
- Dark/light theme with persistent preference
- GitHub-backed project metadata, about stats, language breakdown, and activity feed
- Scroll-reveal animations and mobile swipe navigation between routes
- Agent discovery endpoints for WebMCP tooling

## Project Structure

```
src/
├── components/       # Astro sections and React islands
│   ├── contents/     # Curated sources + generated GitHub data
│   ├── hero/         # Landing hero
│   ├── navigation/   # Nav bar, theme toggle, mobile menu
│   └── projects/     # Carousel, cards, GitHub activity
├── data/             # Static content (experience, routes, footer links)
├── hooks/            # React hooks (theme, swipe navigation)
├── layouts/          # Shared page layout
├── pages/            # Astro routes
├── scripts/client/   # Client-side TS (carousel, reveal, theme, nav)
├── styles/           # Global and animation CSS
└── types/            # Shared TypeScript types

scripts/              # Build-time emit and GitHub sync scripts
.github/workflows/    # CI, deploy, and scheduled content sync
```

## Getting Started

### Prerequisites

- Node.js 24+
- pnpm 11+

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
# Start dev server (runs route/agent emit scripts first)
pnpm dev

# Production build (syncs GitHub data, then builds)
pnpm build

# Preview production build
pnpm preview

# Type check
pnpm typecheck

# Lint and format
pnpm lint
pnpm format
```

### GitHub Content Sync

Build and `pnpm sync` pull live data from the GitHub API into generated TypeScript files (projects, about stats, languages, activity). For local work without API access:

```bash
pnpm sync:projects:offline
pnpm sync:about-stats:offline
pnpm sync:about-languages:offline
pnpm sync:github-activity:offline
```

Set `GITHUB_TOKEN` for authenticated API requests (higher rate limits). A scheduled GitHub Action also opens PRs to refresh project metadata.

### Deploy

CI on `main` builds the site and uploads `dist`. A follow-up workflow deploys to Cloudflare Pages. Manual deploy:

```bash
pnpm deploy
```

## License

This project is open source and available under the [MIT License](LICENSE).
