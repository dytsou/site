export interface ExperiencePost {
  heatmapKey: string;
  title: string;
  subtitle?: string;
  url: string;
  orgUrl?: string;
  date: string;
}

export interface ExperienceEntry {
  heatmapKey: string;
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
    heatmapKey: 'line',
    orgUrl: 'https://www.line.me/',
    period: 'Mar. 2026 – Present',
    location: 'Taipei, Taiwan',
    description: [
      'Protected LINE Login authorization codes from premature consumption by adding merchant-configurable callback exclusions to product metadata crawling.',
      'Automated LINE Giftshop banner cropping using image analysis, Redis caching, and object storage, with fallbacks to original images when processing fails.',
      "Migrated Commerce Tab's Beta CI from Jenkins to GitHub Actions, with reusable workflows for Java 21 builds, automated tests, static analysis, and container images.",
      'Added Brave distributed tracing to Native and Flex content providers, preserving parent trace context and recording module-level latency and asynchronous failures.',
      'Contributed to Commerce Tab personalization, implementing 2 REST APIs and birthday and voting digest cards with asynchronous aggregation, batch reads, and graceful fallbacks.',
      'Selected as a LINE Graduation Sharing Session panel speaker, sharing software engineering challenges with 120+ aspiring developers.',
    ],
    posts: [
      {
        title: 'Graduation Sharing Session at LINE Taiwan Limited | LinkedIn',
        subtitle: 'Sharing my journey at the LINE Graduation Sharing Session.',
        url: 'https://tsou.me/LINE-graduation-post',
        heatmapKey: 'line.graduation',
        orgUrl: 'https://www.line.me',
        date: 'Jun 2026',
      },
      {
        title: 'From Audience to Stage | LinkedIn',
        subtitle:
          'From sitting in the audience two years ago to stepping onto the stage today.',
        url: 'https://tsou.me/LINE-company-visitation-speaker-post',
        heatmapKey: 'line.speaker',
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
    heatmapKey: 'software-quality',
    orgUrl: 'https://sqlab.web.nycu.edu.tw',
    period: 'Sept. 2025 – Jan. 2026',
    location: 'NYCU',
    description: [
      'Integrated AI-assisted test generation into development workflows and measured test coverage and developer effort against a baseline manual-testing workflow.',
      'Compared AI-generated and manually written tests on coverage and review effort; summarised the findings in a research poster.',
      'Advisor: Prof. Shih-Kun Huang',
    ],
    icon: 'graduation-cap',
    color: 'yellow',
  },
  {
    type: 'research',
    title: 'Undergraduate Researcher',
    organization: 'Applied Computing and Multimedia Lab',
    heatmapKey: 'applied-computing',
    orgUrl: 'https://acm.cs.nycu.edu.tw/',
    period: 'Sept. 2024 – Aug. 2025',
    location: 'NYCU',
    description: [
      'Built a monocular-video 3D object detection framework that integrates SAM 2 for temporally consistent segmentation with depth-aware object localisation; evaluated on nuScenes.',
      'Extended a BEV detection baseline (BEVNeXt) with LoRA-based fine-tuning and BEVDepth-inspired depth-context fusion, aiming to reduce training cost under limited compute and to refine bounding boxes across frames.',
      'Implemented integration modules fusing 2D segmentation with 3D detection, plus a containerised multi-GPU training and validation pipeline on nuScenes.',
      'Advisor: Prof. Ching-Chun Huang',
    ],
    icon: 'graduation-cap',
    color: 'purple',
  },
  {
    type: 'leadership',
    title: 'Vice President',
    organization: 'NYCU Software Development Club',
    heatmapKey: 'sdc',
    orgUrl: 'https://www.sdc.nycu.club',
    period: 'Oct. 2023 – Jul. 2026',
    location: 'Hsinchu, Taiwan',
    description: [
      'Helped lead 18 programmes for 163 members across 42 departments.',
      "Overseeing operations for the club's SDC Core System backend (programme/event management, member tracking, team matching, forms).",
      'Organising technical workshops and mentoring student developers.',
    ],
    posts: [
      {
        title: 'From Behind-the-Scenes to Driving the Community | LinkedIn',
        subtitle:
          'Reflecting on my journey as a member of the Administration Committee of NYCU Software Development Club',
        url: 'https://tsou.me/SDC-post',
        heatmapKey: 'sdc.post',
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
    heatmapKey: 'sitcon',
    orgUrl: 'https://sitcon.org/2025',
    period: 'Oct. 2024 – Mar. 2025',
    location: 'Taiwan',
    description: [
      'Curated and coordinated 28 conference sessions (2,180+ rehearsal minutes) for 1,400+ participants.',
      'Reviewed speaker proposals and worked with speakers through rehearsal and delivery.',
    ],
    posts: [
      {
        title: 'A Journey from Participation to Creation | LinkedIn',
        subtitle:
          'My experience curating conference sessions as an Agenda Committee member',
        url: 'https://tsou.me/SITCON-post',
        heatmapKey: 'sitcon.post',
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
  period: 'Sept. 2022 – Present',
  location: 'Hsinchu, Taiwan',
  highlights: [
    'Focus on Software Engineering and Systems',
    'Active member of Software Development Club',
    'Participating in research labs and projects',
    'Building practical applications and contributing to open source',
  ],
};
