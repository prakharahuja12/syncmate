import * as React from 'react';
import { EventCategory } from '../../types/api';
import { CATEGORY_COLORS, CATEGORY_LABELS } from '../../lib/constants';

export interface CategoryBadgeProps {
  category: EventCategory;
  className?: string;
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({ category, className = '' }) => {
  const color = CATEGORY_COLORS[category] || '#8B8D98';
  const label = CATEGORY_LABELS[category] || category;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${className}`}
      style={{
        backgroundColor: `${color}1A`,
        borderColor: `${color}40`,
        color,
      }}
    >
      {label}
    </span>
  );
};
