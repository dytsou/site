export interface FooterLink {
  href: string;
  label: string;
  internal?: boolean;
  external?: boolean;
}

export interface SocialLink {
  href: string;
  label: string;
  icon: 'github' | 'linkedin' | 'mail' | 'send';
}

export const FOOTER_QUICK_LINKS: FooterLink[] = [
  { href: '/about/', label: 'About', internal: true },
  { href: '/experiences/', label: 'Experiences', internal: true },
  { href: '/projects/', label: 'Projects', internal: true },
  { href: '/contact/', label: 'Contact', internal: true },
  { href: 'https://dy.tsou.me/resume', label: 'Resume', external: true },
  { href: 'https://dy.tsou.me/cal', label: 'Calendar', external: true },
];

export const FOOTER_SOCIAL_LINKS: SocialLink[] = [
  { href: 'https://github.com/dytsou/', label: 'GitHub', icon: 'github' },
  {
    href: 'https://www.linkedin.com/in/dytsou',
    label: 'LinkedIn',
    icon: 'linkedin',
  },
  { href: 'mailto:contact@dy.tsou.me', label: 'Email', icon: 'mail' },
  { href: 'https://t.me/dytsou', label: 'Telegram', icon: 'send' },
];
