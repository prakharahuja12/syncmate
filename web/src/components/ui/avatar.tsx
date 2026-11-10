import * as React from 'react';
import { UserSummary } from '../../types/api';

export interface AvatarProps {
  user?: UserSummary | null;
  name?: string;
  color?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  xs: 'h-5 w-5 text-[9px]',
  sm: 'h-6 w-6 text-[10px]',
  md: 'h-8 w-8 text-xs',
  lg: 'h-10 w-10 text-sm',
};

export const Avatar: React.FC<AvatarProps> = ({
  user,
  name,
  color,
  size = 'md',
  className = '',
}) => {
  const displayName = user?.name || name || 'User';
  const bgColor = user?.avatarColor || color || '#5B5BD6';

  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div
      className={`inline-flex items-center justify-center rounded-full font-bold text-white shrink-0 select-none ${sizeClasses[size]} ${className}`}
      style={{ backgroundColor: bgColor }}
      title={displayName}
    >
      {initials}
    </div>
  );
};

export interface AvatarStackProps {
  users: UserSummary[];
  max?: number;
  size?: 'sm' | 'md';
}

export const AvatarStack: React.FC<AvatarStackProps> = ({ users, max = 3, size = 'sm' }) => {
  const visible = users.slice(0, max);
  const remaining = users.length - max;

  return (
    <div className="flex items-center -space-x-1.5 overflow-hidden">
      {visible.map((u, i) => (
        <Avatar key={u.id || i} user={u} size={size} className="ring-2 ring-background" />
      ))}
      {remaining > 0 && (
        <div
          className={`inline-flex items-center justify-center rounded-full bg-surface text-muted font-bold ring-2 ring-background ${sizeClasses[size]}`}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
};
