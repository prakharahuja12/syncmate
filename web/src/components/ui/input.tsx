import * as React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, helperText, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-foreground/80">
            {label}
          </label>
        )}
        <input
          id={inputId}
          type={type}
          className={twMerge(
            clsx(
              'flex h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50',
              error && 'border-priority-high focus-visible:ring-priority-high',
              className
            )
          )}
          ref={ref}
          {...props}
        />
        {error ? (
          <p className="text-xs text-priority-high">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-muted">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';

