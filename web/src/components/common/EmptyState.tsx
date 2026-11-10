import * as React from 'react';
import { Button } from '../ui/button';

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: string | React.ReactNode;
  actionTitle?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon = '📭',
  actionTitle,
  onAction,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {description && <p className="text-xs text-muted max-w-sm mt-1 mb-4">{description}</p>}
      {actionTitle && onAction && (
        <Button onClick={onAction} size="sm">
          {actionTitle}
        </Button>
      )}
    </div>
  );
};

