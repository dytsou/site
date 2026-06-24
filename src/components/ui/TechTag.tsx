import './Button.css';

interface TechTagProps {
  technology: string;
  className?: string;
}

export function TechTag({
  technology,
  className = '',
}: Readonly<TechTagProps>) {
  return <span className={`tech-tag ${className}`}>{technology}</span>;
}
