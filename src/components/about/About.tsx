import { useAppSelector } from '../../store/hooks';
import { Section } from '../layout/Section';
import { SectionHeader } from '../layout/SectionHeader';
import { ProfileImage } from './ProfileImage';
import { AboutContent } from '../contents/About';
import { StatsCards } from './StatsCards';
import { LanguageGrid } from './language-grid/LanguageGrid';
import { FALLBACK_PUBLIC_REPOS } from './AboutStats.generated';

export function About() {
  const stats = useAppSelector((state) => state.github.stats);

  return (
    <Section id="about">
      <SectionHeader title="About Me" />

      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <ProfileImage />

        <div className="space-y-6">
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
