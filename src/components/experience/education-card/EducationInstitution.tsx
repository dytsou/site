interface EducationInstitutionProps {
  institution: string;
  degree: string;
}

export function EducationInstitution({
  institution,
  degree,
}: EducationInstitutionProps) {
  return (
    <>
      <h3 className="education-institution">{institution}</h3>
      <div className="education-degree">{degree}</div>
    </>
  );
}
