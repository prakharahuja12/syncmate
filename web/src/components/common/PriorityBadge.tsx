import * as React from 'react';
import { EventPriority } from '../../types/api';
import { PRIORITY_COLORS, PRIORITY_LABELS } from '../../lib/constants';

export interface PriorityBadgeProps {
  priority: EventPriority;
  showLabel?: boolean;
  className?: string;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  priority,
  showLabel = true,
  className = '',
}) => {
  const color = PRIORITY_COLORS[priority];
  const label = PRIORITY_LABELS[priority];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold border ${className}`}
      style={{
        backgroundColor: `${color}1A`,
        borderColor: `${color}40`,
        color,
      }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      {showLabel && <span>{label}</span>}
    </span>
  );
};
