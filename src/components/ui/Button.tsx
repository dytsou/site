import { LucideIcon } from 'lucide-react';
import './Button.css';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'right',
  className = '',
  disabled = false,
  type = 'button',
}: Readonly<ButtonProps>) {
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    outline: 'btn-outline',
  };

  const sizeClasses = {
    sm: 'btn-sm',
    md: 'btn-md',
    lg: 'btn-lg',
  };

  const iconClasses = Icon ? 'btn-with-icon' : '';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`btn-base ${variantClasses[variant]} ${sizeClasses[size]} ${iconClasses} ${className}`}
    >
      {Icon && iconPosition === 'left' && <Icon className="btn-icon-size" />}
      {children}
      {Icon && iconPosition === 'right' && <Icon className="btn-icon-size" />}
    </button>
  );
}
