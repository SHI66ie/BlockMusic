import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md';
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center rounded-full font-medium';
    
    const variants = {
      primary: 'badge-primary',
      secondary: 'badge-secondary',
      success: 'badge-success',
      warning: 'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-warning-500/20 text-warning-300 border border-warning-500/30',
      error: 'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-error-500/20 text-error-300 border border-error-500/30'
    };
    
    const sizes = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-3 py-1 text-xs'
    };

    return (
      <span
        className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className || ''}`}
        ref={ref}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export { Badge };
