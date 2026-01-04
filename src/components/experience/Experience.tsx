import { Section } from '../layout/Section';
import { SectionHeader } from '../layout/SectionHeader';
import { EducationCard } from './education-card/EducationCard';
import { ExperienceTimeline } from './ExperienceTimeline';
import { experiences, education } from '../contents/Experience';

export function Experience() {
  return (
    <Section id="experience" background="gray">
      <SectionHeader title="Experience & Education" />

      <EducationCard education={education} />
      <ExperienceTimeline experiences={experiences} />
    </Section>
  );
}
