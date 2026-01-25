import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || `input-${React.useId()}`;

    return (
      <div className="space-y-2">
        {label && (
          <label 
            htmlFor={inputId}
            className="block text-sm font-medium text-neutral-200"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          className={`music-input ${className || ''} ${error ? 'border-error-500 focus:ring-error-500' : ''}`}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="text-sm text-error-400">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
