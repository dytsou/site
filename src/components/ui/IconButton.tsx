import { LucideIcon } from 'lucide-react';
import './Button.css';

interface IconButtonProps {
  icon: LucideIcon;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
  'aria-label'?: string;
}

export function IconButton({
  icon: Icon,
  onClick,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  'aria-label': ariaLabel,
}: IconButtonProps) {
  const variantClasses = {
    primary: 'icon-btn-primary',
    secondary: 'icon-btn-secondary',
    tertiary: 'icon-btn-tertiary',
    outline: 'icon-btn-outline',
    ghost: 'icon-btn-ghost',
  };

  const sizeClasses = {
    sm: 'icon-btn-sm',
    md: 'icon-btn-md',
    lg: 'icon-btn-lg',
  };

  const iconSizeClasses = {
    sm: 'icon-btn-icon-sm',
    md: 'icon-btn-icon-md',
    lg: 'icon-btn-icon-lg',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`icon-btn-base ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      <Icon className={iconSizeClasses[size]} />
    </button>
  );
}
