import * as React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  isUrgent?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, isUrgent, ...props }, ref) => (
    <div
      ref={ref}
      className={twMerge(
        clsx(
          'rounded-xl border border-border bg-card p-4 text-foreground transition-all duration-150',
          isUrgent && 'border-l-4 border-l-priority-high bg-priority-high/5',
          className
        )
      )}
      {...props}
    />
  )
);
Card.displayName = 'Card';

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={twMerge(clsx('flex flex-col space-y-1.5 pb-2', className))} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={twMerge(clsx('font-semibold leading-none tracking-tight', className))} {...props} />
  )
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={twMerge(clsx('text-xs text-muted', className))} {...props} />
  )
);
CardDescription.displayName = 'CardDescription';

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={twMerge(clsx('pt-0', className))} {...props} />
  )
);
CardContent.displayName = 'CardContent';

