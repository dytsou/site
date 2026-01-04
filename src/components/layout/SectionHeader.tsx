import './Section.css';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export function SectionHeader({
  title,
  subtitle,
  className = '',
}: SectionHeaderProps) {
  return (
    <div className={`section-header ${className}`}>
      <h2 className="section-title">{title}</h2>
      <div className="section-divider"></div>
      {subtitle && <p className="section-subtitle">{subtitle}</p>}
    </div>
  );
}
