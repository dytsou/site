import { useAppSelector } from '../../store/hooks';
import { Section } from '../layout/Section';
import { SectionHeader } from '../layout/SectionHeader';
import { ProfileImage } from './ProfileImage';
import { AboutContent } from '../contents/About';
import { StatsCards } from './StatsCards';
import { LanguageGrid } from './language-grid/LanguageGrid';
import { FALLBACK_PUBLIC_REPOS } from './AboutStats.generated';
import './About.css';

export function About() {
  const stats = useAppSelector((state) => state.github.stats);

  return (
    <Section id="about">
      <SectionHeader
        title="About Me"
        subtitle="Student engineer focused on backend scalability, full‑stack product craft, and applied research."
      />

      <div className="about-layout">
        <ProfileImage />

        <div className="about-right-col">
          <AboutContent />
          <StatsCards
            publicRepos={stats?.public_repos ?? FALLBACK_PUBLIC_REPOS}
          />
          <LanguageGrid />
        </div>
      </div>
    </Section>
  );
}
