import {
  Boxes,
  Cpu,
  Terminal,
  Database,
  Globe,
  Bot,
  Rocket,
  Layers,
  LayoutDashboard,
  CalendarDays,
  CircleDot,
  Puzzle,
  Disc,
  Clock,
  Link2,
  FileText,
  BarChart3,
  ArrowRightLeft,
  Users,
  Calendar,
} from 'lucide-react';
import type { ComponentType } from 'react';
import type { Project } from '../../types/projects';
import './ProjectIconUtils.css';

interface IconConfig {
  Icon: ComponentType<{ className?: string }>;
  bgClass: string;
  iconClass: string;
  matchers: {
    title?: string[];
    tech?: string[];
  };
}

const iconConfigs: IconConfig[] = [
  // Title-based mappings (checked first for specificity)
  {
    Icon: Clock,
    bgClass: 'project-icon-bg-koreji',
    iconClass: 'project-icon-koreji',
    matchers: { title: ['koreji'] },
  },
  {
    Icon: LayoutDashboard,
    bgClass: 'project-icon-bg-core-system',
    iconClass: 'project-icon-core-system',
    matchers: { title: ['core system'] },
  },
  {
    Icon: CalendarDays,
    bgClass: 'project-icon-bg-calendar',
    iconClass: 'project-icon-calendar',
    matchers: { title: ['caiender', 'caiendar'] },
  },
  {
    Icon: Calendar,
    bgClass: 'project-icon-bg-cal',
    iconClass: 'project-icon-cal',
    matchers: { title: ['cal'] },
  },
  {
    Icon: Link2,
    bgClass: 'project-icon-bg-shorten-url',
    iconClass: 'project-icon-shorten-url',
    matchers: { title: ['shorten url', 'shorten-url'] },
  },
  {
    Icon: FileText,
    bgClass: 'project-icon-bg-resume',
    iconClass: 'project-icon-resume',
    matchers: { title: ['resume'] },
  },
  {
    Icon: BarChart3,
    bgClass: 'project-icon-bg-github-stats',
    iconClass: 'project-icon-github-stats',
    matchers: { title: ['github readme stats', 'github-readme-stats'] },
  },
  {
    Icon: ArrowRightLeft,
    bgClass: 'project-icon-bg-rsync',
    iconClass: 'project-icon-rsync',
    matchers: { title: ['rsync', 'raycast'] },
  },
  {
    Icon: Users,
    bgClass: 'project-icon-bg-scheduler',
    iconClass: 'project-icon-scheduler',
    matchers: { title: ['scheduler', 'intern corner'] },
  },
  {
    Icon: CircleDot,
    bgClass: 'project-icon-bg-ballquest',
    iconClass: 'project-icon-ballquest',
    matchers: { title: ['ballquest'] },
  },
  {
    Icon: Puzzle,
    bgClass: 'project-icon-bg-dungeon',
    iconClass: 'project-icon-dungeon',
    matchers: { title: ['dungeon'] },
  },
  {
    Icon: Disc,
    bgClass: 'project-icon-bg-reversi',
    iconClass: 'project-icon-reversi',
    matchers: { title: ['reversi'] },
  },
  // Technology and mixed mappings
  {
    Icon: Terminal,
    bgClass: 'project-icon-bg-backend',
    iconClass: 'project-icon-backend',
    matchers: { tech: ['go'], title: ['backend'] },
  },
  {
    Icon: Boxes,
    bgClass: 'project-icon-bg-docker',
    iconClass: 'project-icon-docker',
    matchers: { tech: ['docker'] },
  },
  {
    Icon: Database,
    bgClass: 'project-icon-bg-database',
    iconClass: 'project-icon-database',
    matchers: { tech: ['postgresql', 'database'] },
  },
  {
    Icon: Layers,
    bgClass: 'project-icon-bg-graphql',
    iconClass: 'project-icon-graphql',
    matchers: { tech: ['graphql'] },
  },
  {
    Icon: Rocket,
    bgClass: 'project-icon-bg-flutter',
    iconClass: 'project-icon-flutter',
    matchers: { tech: ['flutter', 'dart'] },
  },
  {
    Icon: Cpu,
    bgClass: 'project-icon-bg-game',
    iconClass: 'project-icon-game',
    matchers: { tech: ['c++', 'c'], title: ['game'] },
  },
  {
    Icon: Bot,
    bgClass: 'project-icon-bg-ai',
    iconClass: 'project-icon-ai',
    matchers: { tech: ['ai', 'llm'], title: ['ai'] },
  },
];

const defaultConfig: IconConfig = {
  Icon: Globe,
  bgClass: 'project-icon-bg-default',
  iconClass: 'project-icon-default',
  matchers: {},
};

export function getProjectIconAndColors(project: Project): {
  Icon: ComponentType<{ className?: string }>;
  bgClass: string;
  iconClass: string;
} {
  const tech = [...(project.technologies || []), ...(project.tags || [])].map(
    (t: string) => t.toLowerCase()
  );
  const title = String(project.title || '').toLowerCase();

  // Find matching configuration
  const match = iconConfigs.find((config) => {
    const { title: titleMatchers = [], tech: techMatchers = [] } =
      config.matchers;

    const titleMatch =
      titleMatchers.length > 0 &&
      titleMatchers.some((matcher) => title.includes(matcher));
    const techMatch =
      techMatchers.length > 0 &&
      techMatchers.some((matcher) => tech.includes(matcher));

    return titleMatch || techMatch;
  });

  const config = match || defaultConfig;

  return {
    Icon: config.Icon,
    bgClass: config.bgClass,
    iconClass: config.iconClass,
  };
}
