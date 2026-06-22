export type ContactPlatform = 'linkedin' | 'github' | 'email';

export type ContactCard = {
  platform: ContactPlatform;
  title: string;
  subtitle: string;
  url: string;
};

export const CONTACT_CARDS: ContactCard[] = [
  {
    platform: 'linkedin',
    title: 'LinkedIn',
    subtitle: 'linkedin.com/in/dytsou/',
    url: 'https://www.linkedin.com/in/dytsou/',
  },
  {
    platform: 'github',
    title: 'GitHub',
    subtitle: '@dytsou',
    url: 'https://github.com/dytsou',
  },
  {
    platform: 'email',
    title: 'Email Me',
    subtitle: 'contact@dy.tsou.me',
    url: 'mailto:contact@dy.tsou.me',
  },
];
