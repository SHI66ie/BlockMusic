import React from 'react';
import { cn } from '../../utils/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading = false, icon, children, disabled, ...props }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus-ring disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variants = {
      primary: 'music-button',
      secondary: 'music-button-secondary', 
      ghost: 'music-button-ghost',
      danger: 'px-6 py-3 bg-error-600 hover:bg-error-700 text-white font-medium rounded-xl transition-all duration-200 hover:scale-105 active:scale-95'
    };
    
    const sizes = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3',
      lg: 'px-8 py-4 text-lg'
    };

    return (
      <button
        className={cn(
          baseClasses,
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <div className="animate-spin-slow mr-2">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"></div>
          </div>
        )}
        {!loading && icon && <span className="mr-2">{icon}</span>}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
