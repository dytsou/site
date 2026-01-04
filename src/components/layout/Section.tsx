import './Section.css';

interface SectionProps {
  id: string;
  children: React.ReactNode;
  className?: string;
  background?: 'white' | 'gray';
}

export function Section({
  id,
  children,
  className = '',
  background = 'white',
}: SectionProps) {
  const backgroundClass =
    background === 'gray' ? 'section-gray' : 'section-white';

  return (
    <section id={id} className={`section-base ${backgroundClass} ${className}`}>
      <div className="section-container">{children}</div>
    </section>
  );
}
