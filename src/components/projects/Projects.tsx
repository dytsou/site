import { useAppSelector } from '../../store/hooks';
import { ProjectCarousel } from './carousel/ProjectCarousel';
import { GitHubActivity } from './github-activity/GitHubActivity';
import { PROJECTS_CONTENTS } from '../contents/Projects.generated';
import { Section } from '../layout/Section';
import { SectionHeader } from '../layout/SectionHeader';

export function Projects() {
  const repos = useAppSelector((state) => state.github.repos);
  const reposLoading = useAppSelector((state) => state.github.loading);

  return (
    <Section id="projects">
      <SectionHeader
        title="Featured Projects"
        subtitle="A collection of my projects"
      />

      {PROJECTS_CONTENTS.length > 0 && (
        <div>
          <ProjectCarousel projects={PROJECTS_CONTENTS} featured />
        </div>
      )}

      <GitHubActivity repos={repos} loading={reposLoading} />
    </Section>
  );
}
