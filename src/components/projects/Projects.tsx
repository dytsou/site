import { useAppSelector } from '../../store/hooks';
import { ProjectCarousel } from './carousel/ProjectCarousel';
import { GitHubActivity } from './github-activity/GitHubActivity';
import { PROJECTS_CONTENTS } from '../contents/Projects';
import { Section } from '../layout/Section';
import { SectionHeader } from '../layout/SectionHeader';

export function Projects() {
  const repos = useAppSelector((state) => state.github.repos);
  const reposLoading = useAppSelector((state) => state.github.loading);

  // Merge all projects with featured projects first, then others
  const allProjects = [
    ...PROJECTS_CONTENTS.filter((p) => p.featured),
    ...PROJECTS_CONTENTS.filter((p) => !p.featured),
  ];

  return (
    <Section id="projects">
      <SectionHeader
        title="Featured Projects"
        subtitle="A collection of my projects"
      />

      {allProjects.length > 0 && (
        <div>
          <ProjectCarousel projects={allProjects} featured />
        </div>
      )}

      <GitHubActivity repos={repos} loading={reposLoading} />
    </Section>
  );
}
