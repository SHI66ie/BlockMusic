import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  glass?: boolean;
  vinyl?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, hover = false, glass = false, vinyl = false, children, ...props }, ref) => {
    const baseClasses = 'rounded-xl border transition-all duration-200';
    
    let variantClasses = 'bg-neutral-900 border-neutral-700 p-6';
    
    if (glass) {
      variantClasses = 'glass p-6';
    } else if (vinyl) {
      variantClasses = 'vinyl-card p-6';
    }
    
    const hoverClasses = hover ? 'hover:border-neutral-600 hover:shadow-music hover:scale-[1.02] cursor-pointer' : '';

    return (
      <div
        className={`${baseClasses} ${variantClasses} ${hoverClasses} ${className || ''}`}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export { Card };
