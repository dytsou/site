import type { Project } from '../types/projects';

interface IconConfig {
  bgClass: string;
  iconClass: string;
  matchers: {
    title?: string[];
    tech?: string[];
  };
}

const iconConfigs: IconConfig[] = [
  {
    bgClass: 'project-icon-bg-koreji',
    iconClass: 'project-icon-koreji',
    matchers: { title: ['koreji'] },
  },
  {
    bgClass: 'project-icon-bg-core-system',
    iconClass: 'project-icon-core-system',
    matchers: { title: ['core system'] },
  },
  {
    bgClass: 'project-icon-bg-calendar',
    iconClass: 'project-icon-calendar',
    matchers: { title: ['caiender', 'caiendar'] },
  },
  {
    bgClass: 'project-icon-bg-cal',
    iconClass: 'project-icon-cal',
    matchers: { title: ['cal'] },
  },
  {
    bgClass: 'project-icon-bg-shorten-url',
    iconClass: 'project-icon-shorten-url',
    matchers: { title: ['shorten url', 'shorten-url'] },
  },
  {
    bgClass: 'project-icon-bg-resume',
    iconClass: 'project-icon-resume',
    matchers: { title: ['resume'] },
  },
  {
    bgClass: 'project-icon-bg-github-stats',
    iconClass: 'project-icon-github-stats',
    matchers: { title: ['github readme stats', 'github-readme-stats'] },
  },
  {
    bgClass: 'project-icon-bg-rsync',
    iconClass: 'project-icon-rsync',
    matchers: { title: ['rsync', 'raycast'] },
  },
  {
    bgClass: 'project-icon-bg-scheduler',
    iconClass: 'project-icon-scheduler',
    matchers: { title: ['scheduler', 'intern corner'] },
  },
  {
    bgClass: 'project-icon-bg-ballquest',
    iconClass: 'project-icon-ballquest',
    matchers: { title: ['ballquest'] },
  },
  {
    bgClass: 'project-icon-bg-dungeon',
    iconClass: 'project-icon-dungeon',
    matchers: { title: ['dungeon'] },
  },
  {
    bgClass: 'project-icon-bg-reversi',
    iconClass: 'project-icon-reversi',
    matchers: { title: ['reversi'] },
  },
  {
    bgClass: 'project-icon-bg-backend',
    iconClass: 'project-icon-backend',
    matchers: { tech: ['go'], title: ['backend'] },
  },
  {
    bgClass: 'project-icon-bg-docker',
    iconClass: 'project-icon-docker',
    matchers: { tech: ['docker'] },
  },
  {
    bgClass: 'project-icon-bg-database',
    iconClass: 'project-icon-database',
    matchers: { tech: ['postgresql', 'database'] },
  },
  {
    bgClass: 'project-icon-bg-graphql',
    iconClass: 'project-icon-graphql',
    matchers: { tech: ['graphql'] },
  },
  {
    bgClass: 'project-icon-bg-flutter',
    iconClass: 'project-icon-flutter',
    matchers: { tech: ['flutter', 'dart'] },
  },
  {
    bgClass: 'project-icon-bg-game',
    iconClass: 'project-icon-game',
    matchers: { tech: ['c++', 'c'], title: ['game'] },
  },
  {
    bgClass: 'project-icon-bg-ai',
    iconClass: 'project-icon-ai',
    matchers: { tech: ['ai', 'llm'], title: ['ai'] },
  },
];

const defaultConfig: IconConfig = {
  bgClass: 'project-icon-bg-default',
  iconClass: 'project-icon-default',
  matchers: {},
};

export function getProjectIconClasses(project: Project): {
  bgClass: string;
  iconClass: string;
} {
  const tech = new Set(
    [...(project.technologies || []), ...(project.tags || [])].map((t) =>
      t.toLowerCase()
    )
  );
  const title = String(project.title || '').toLowerCase();

  const match = iconConfigs.find((config) => {
    const { title: titleMatchers = [], tech: techMatchers = [] } =
      config.matchers;
    const titleMatch =
      titleMatchers.length > 0 &&
      titleMatchers.some((matcher) => title.includes(matcher));
    const techMatch =
      techMatchers.length > 0 &&
      techMatchers.some((matcher) => tech.has(matcher));
    return titleMatch || techMatch;
  });

  const config = match || defaultConfig;
  return { bgClass: config.bgClass, iconClass: config.iconClass };
}
