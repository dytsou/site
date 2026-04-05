import { Mail, Send, LucideIcon } from 'lucide-react';
import { Github, Linkedin } from '../icons/brandSocialIcons';

export interface FooterLink {
  href: string;
  label: string;
  internal?: boolean;
  external?: boolean;
}

export interface SocialLink {
  href: string;
  icon: LucideIcon;
  label: string;
}

export interface FooterSection {
  quickLinks: {
    title: string;
    links: FooterLink[];
  };
  connect: {
    title: string;
    socialLinks: SocialLink[];
  };
}

export const FOOTER_SECTIONS: FooterSection = {
  quickLinks: {
    title: 'Quick Links',
    links: [
      { href: '/about', label: 'About', internal: true },
      { href: '/experiences', label: 'Experiences', internal: true },
      { href: '/projects', label: 'Projects', internal: true },
      { href: '/contact', label: 'Contact', internal: true },
      { href: 'https://dy.tsou.me/resume', label: 'Resume', external: true },
      { href: 'https://dy.tsou.me/cal', label: 'Calendar', external: true },
    ],
  },
  connect: {
    title: 'Connect',
    socialLinks: [
      {
        href: 'https://github.com/dytsou/',
        icon: Github,
        label: 'GitHub',
      },
      {
        href: 'https://www.linkedin.com/in/dytsou',
        icon: Linkedin,
        label: 'LinkedIn',
      },
      {
        href: 'mailto:contact@dy.tsou.me',
        icon: Mail,
        label: 'Email',
      },
      {
        href: 'https://t.me/dytsou',
        icon: Send,
        label: 'Telegram',
      },
    ],
  },
};
