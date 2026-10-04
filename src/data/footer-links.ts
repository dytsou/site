export interface FooterLink {
  heatmapKey: string;
  href: string;
  label: string;
  internal?: boolean;
  external?: boolean;
}

export interface SocialLink {
  heatmapKey: string;
  href: string;
  label: string;
  icon: 'github' | 'linkedin' | 'mail' | 'send';
}

export const FOOTER_QUICK_LINKS: FooterLink[] = [
  { heatmapKey: 'about', href: '/about/', label: 'About', internal: true },
  {
    heatmapKey: 'experiences',
    href: '/experiences/',
    label: 'Experiences',
    internal: true,
  },
  {
    heatmapKey: 'projects',
    href: '/projects/',
    label: 'Projects',
    internal: true,
  },
  {
    heatmapKey: 'contact',
    href: '/contact/',
    label: 'Contact',
    internal: true,
  },
  {
    heatmapKey: 'resume',
    href: 'https://dy.tsou.me/resume',
    label: 'Resume',
    external: true,
  },
  {
    heatmapKey: 'calendar',
    href: 'https://dy.tsou.me/cal',
    label: 'Calendar',
    external: true,
  },
];

export const FOOTER_SOCIAL_LINKS: SocialLink[] = [
  {
    heatmapKey: 'github',
    href: 'https://github.com/dytsou/',
    label: 'GitHub',
    icon: 'github',
  },
  {
    heatmapKey: 'linkedin',
    href: 'https://www.linkedin.com/in/dytsou',
    label: 'LinkedIn',
    icon: 'linkedin',
  },
  {
    heatmapKey: 'email',
    href: 'mailto:contact@dy.tsou.me',
    label: 'Email',
    icon: 'mail',
  },
  {
    heatmapKey: 'telegram',
    href: 'https://t.me/dytsou',
    label: 'Telegram',
    icon: 'send',
  },
];
