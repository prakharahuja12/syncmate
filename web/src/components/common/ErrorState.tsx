import * as React from 'react';
import { Button } from '../ui/button';

export interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message = 'Failed to load content. Please verify your connection.',
  onRetry,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-10 px-4 text-center ${className}`}>
      <div className="text-3xl mb-2">⚠️</div>
      <h3 className="text-sm font-semibold text-foreground">Something went wrong</h3>
      <p className="text-xs text-muted max-w-sm mt-1 mb-4">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="secondary" size="sm">
          Try again
        </Button>
      )}
    </div>
  );
};
