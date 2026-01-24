import { Briefcase, GraduationCap } from 'lucide-react';
import { Experience } from '../experience/types';

export interface Education {
  degree: string;
  institution: string;
  period: string;
  location: string;
  highlights: string[];
}

export const experiences: Experience[] = [
  {
    type: 'leadership',
    title: 'Vice President',
    organization: 'NYCU Software Development Club',
    orgUrl: 'https://www.sdc.nycu.club',
    period: 'Oct 2023 - Present',
    location: 'Hsinchu, Taiwan',
    description: [
      'Leading a community of 100+ student developers',
      'Organizing technical workshops and hackathons',
      'Managing club operations and strategic planning',
      'Mentoring students in software development',
    ],
    posts: [
      {
        title: 'From Behind-the-Scenes to Driving the Community | LinkedIn',
        subtitle:
          'Reflecting on my journey as Administration Committee of NYCU Software Development Club',
        url: 'https://tsou.me/SDC-post',
        orgUrl: 'https://www.sdc.nycu.club',
        date: 'Aug 2025',
      },
    ],
    icon: Briefcase,
    color: 'blue',
  },
  {
    type: 'leadership',
    title: 'Agenda Committee',
    organization: "SITCON, Students' Information Technology Conference",
    orgUrl: 'https://sitcon.org/2025',
    period: 'Oct 2024 - Mar 2025',
    location: 'Taiwan',
    description: [
      "Curating technical content for Taiwan's largest student tech conference",
      'Reviewing and selecting speaker proposals',
      'Coordinating with speakers and organizing sessions',
      'Contributing to conference planning and execution',
    ],
    posts: [
      {
        title: 'A Journey from Participation to Creation | LinkedIn',
        subtitle:
          "My experience curating content for Taiwan's largest student tech conference as an Agenda Committee member",
        url: 'https://tsou.me/SITCON-post',
        orgUrl: 'https://sitcon.org/2025',
        date: 'May 2025',
      },
    ],
    icon: Briefcase,
    color: 'cyan',
  },
  {
    type: 'research',
    organization: 'Software Quality Lab',
    orgUrl: 'https://sqlab.web.nycu.edu.tw',
    period: 'Sep 2025 - Present',
    location: 'NYCU',
    description: [
      'Researching impact of AI-generated testing on software quality',
      'Analyzing test coverage and effectiveness metrics',
      'Collaborating with senior members on research methodology',
      'Contributing to research projects',
    ],
    icon: GraduationCap,
    color: 'green',
  },
  {
    type: 'research',
    organization: 'Applied Computing and Multimedia Lab',
    orgUrl: ' http://acm.cs.nycu.edu.tw/',
    period: 'Sep 2024 - Aug 2025',
    location: 'NYCU',
    description: [
      'Working on video-based 3D object detection',
      'Implementing computer vision algorithms',
      'Processing and analyzing large-scale video datasets',
      'Optimizing model performance and accuracy',
    ],
    icon: GraduationCap,
    color: 'purple',
  },
];

export const education: Education = {
  degree: 'Bachelor of Science in Computer Science',
  institution: 'National Yang Ming Chiao Tung University',
  period: 'Sep 2022 - Present',
  location: 'Hsinchu, Taiwan',
  highlights: [
    'Focus on Software Engineering and Systems',
    'Active member of Software Development Club',
    'Participating in research labs and projects',
    'Building practical applications and contributing to open source',
  ],
};
