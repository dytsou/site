export interface ExperiencePost {
  title: string;
  subtitle?: string;
  url: string;
  orgUrl?: string;
  date: string;
}

export interface ExperienceEntry {
  type: string;
  title?: string;
  organization?: string;
  orgUrl?: string;
  period?: string;
  location?: string;
  description?: string[];
  posts?: ExperiencePost[];
  icon: 'briefcase' | 'graduation-cap' | 'users' | 'presentation';
  color: string;
}

export interface EducationEntry {
  degree: string;
  institution: string;
  period: string;
  location: string;
  highlights: string[];
}

export const experiences: ExperienceEntry[] = [
  {
    type: 'work',
    title: 'Software Engineer Intern',
    organization: 'LINE Taiwan Limited',
    orgUrl: 'https://www.line.me/',
    period: 'Mar 2026 - Present',
    location: 'Taiwan',
    description: [
      'Built high-performance LINE Shopping RESTful/gRPC microservices using Spring Boot, Redis, and Kafka to ensure service reliability',
      'Collaborated in a 20-member Scrum team and aligned API contracts and dependencies across multiple product squads',
      'Selected as a LINE Graduation Sharing Session panel speaker, presenting real-world challenges to over 120 aspiring developers',
    ],
    posts: [
      {
        title: 'Graduation Sharing Session at LINE Taiwan Limited | LinkedIn',
        subtitle: 'Sharing my journey at the LINE Graduation Sharing Session.',
        url: 'https://tsou.me/LINE-graduation-post',
        orgUrl: 'https://www.line.me',
        date: 'Jun 2026',
      },
      {
        title: 'From Audience to Stage | LinkedIn',
        subtitle:
          'From sitting in the audience two years ago to stepping onto the stage today.',
        url: 'https://tsou.me/LINE-company-visitation-speaker-post',
        orgUrl: 'https://www.line.me',
        date: 'Jul 2026',
      },
    ],
    icon: 'briefcase',
    color: 'green',
  },
  {
    type: 'research',
    title: 'Undergraduate Researcher',
    organization: 'Software Quality Lab',
    orgUrl: 'https://sqlab.web.nycu.edu.tw',
    period: 'Sep 2025 - Jan 2026',
    location: 'NYCU',
    description: [
      'Researching impact of AI-generated testing on software quality',
      'Analyzing test coverage and effectiveness metrics',
      'Collaborating with senior members on research methodology',
      'Contributing to research projects',
    ],
    icon: 'graduation-cap',
    color: 'yellow',
  },
  {
    type: 'research',
    title: 'Undergraduate Researcher',
    organization: 'Applied Computing and Multimedia Lab',
    orgUrl: 'https://acm.cs.nycu.edu.tw/',
    period: 'Sep 2024 - Aug 2025',
    location: 'NYCU',
    description: [
      'Working on video-based 3D object detection',
      'Implementing computer vision algorithms',
      'Processing and analyzing large-scale video datasets',
      'Optimizing model performance and accuracy',
    ],
    icon: 'graduation-cap',
    color: 'purple',
  },
  {
    type: 'leadership',
    title: 'Vice President',
    organization: 'NYCU Software Development Club',
    orgUrl: 'https://www.sdc.nycu.club',
    period: 'Oct 2023 - Jul. 2026',
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
          'Reflecting on my journey as a member of the Administration Committee of NYCU Software Development Club',
        url: 'https://tsou.me/SDC-post',
        orgUrl: 'https://www.sdc.nycu.club',
        date: 'Aug 2025',
      },
    ],
    icon: 'users',
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
    icon: 'users',
    color: 'cyan',
  },
];

export const education: EducationEntry = {
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
