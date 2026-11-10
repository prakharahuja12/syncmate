import * as React from 'react';

export interface SyncmateLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export const SyncmateLogo: React.FC<SyncmateLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
}) => {
  const iconSizes = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base font-bold',
    lg: 'text-xl font-extrabold',
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Figma Mint Capsule Badge */}
      <div className={`flex items-center justify-center shrink-0 ${iconSizes[size]}`}>
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-full w-full drop-shadow-sm"
        >
          <rect width="32" height="32" rx="10" fill="#2DD4BF" />
          <rect x="9.5" y="8.5" width="4.5" height="15" rx="2.25" fill="#042F2E" />
          <rect x="18" y="8.5" width="4.5" height="15" rx="2.25" fill="#042F2E" />
        </svg>
      </div>

      {showText && (
        <span className={`tracking-tight text-foreground font-sans lowercase ${textSizes[size]}`}>
          syncmate
        </span>
      )}
    </div>
  );
};
