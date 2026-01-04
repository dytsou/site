import { Mail, Github, Linkedin, LucideIcon } from 'lucide-react';

export interface ContactCard {
  platform: 'linkedin' | 'github' | 'email';
  title: string;
  subtitle: string;
  url: string;
  icon: LucideIcon;
}

export const CONTACT_CARDS: ContactCard[] = [
  {
    platform: 'linkedin' as const,
    title: 'LinkedIn',
    subtitle: 'linkedin.com/in/dytsou/',
    url: 'https://www.linkedin.com/in/dytsou/',
    icon: Linkedin,
  },
  {
    platform: 'github' as const,
    title: 'GitHub',
    subtitle: '@dytsou',
    url: 'https://github.com/dytsou',
    icon: Github,
  },
  {
    platform: 'email' as const,
    title: 'Email Me',
    subtitle: 'contact@dy.tsou.me',
    url: 'mailto:contact@dy.tsou.me',
    icon: Mail,
  },
];

export interface Opportunity {
  label: string;
  color: 'blue' | 'cyan' | 'green' | 'purple';
}

export const OPPORTUNITIES: Opportunity[] = [
  { label: 'Backend Development Roles', color: 'blue' },
  { label: 'Full-Stack Engineering Positions', color: 'cyan' },
  { label: 'Research Collaborations', color: 'green' },
  { label: 'Quality Assurance Engineering Positions', color: 'purple' },
];
