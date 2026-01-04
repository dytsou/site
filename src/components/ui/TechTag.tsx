import './Button.css';

interface TechTagProps {
  technology: string;
  className?: string;
}

export function TechTag({ technology, className = '' }: TechTagProps) {
  return <span className={`tech-tag ${className}`}>{technology}</span>;
}
