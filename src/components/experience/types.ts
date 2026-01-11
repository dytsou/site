import { LucideIcon } from 'lucide-react';

export interface Post {
  title: string;
  subtitle?: string;
  url: string;
  orgUrl?: string;
  date: string;
}

export interface Experience {
  type: string;
  title?: string;
  organization?: string;
  orgUrl?: string;
  period?: string;
  location?: string;
  description?: string[];
  posts?: Post[];
  icon: LucideIcon;
  color: string;
}
