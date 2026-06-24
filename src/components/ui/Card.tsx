import './Button.css';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'sm' | 'md' | 'lg';
}

export function Card({
  children,
  className = '',
  hover = false,
  padding = 'md',
}: Readonly<CardProps>) {
  const paddingClass = {
    sm: 'card-padding-sm',
    md: 'card-padding-md',
    lg: 'card-padding-lg',
  };

  const hoverClass = hover ? 'card-hover' : '';

  return (
    <div
      className={`card-base ${paddingClass[padding]} ${hoverClass} ${className}`}
    >
      {children}
    </div>
  );
}
