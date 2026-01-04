export interface NavLink {
  path: string;
  label: string;
  external?: boolean;
}

export const navLinks: NavLink[] = [
  { path: '/about', label: 'About' },
  { path: '/experiences', label: 'Experiences' },
  { path: '/projects', label: 'Projects' },
  { path: '/contact', label: 'Contact' },
  { path: 'https://dy.tsou.me/resume', label: 'Resume', external: true },
];
