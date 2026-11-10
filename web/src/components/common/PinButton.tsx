import * as React from 'react';
import { PinSummary, PinVisibility } from '../../types/api';

export interface PinButtonProps {
  pinSummary: PinSummary;
  onPin: (visibility: PinVisibility) => void;
  onUnpin: () => void;
  className?: string;
}

export const PinButton: React.FC<PinButtonProps> = ({
  pinSummary,
  onPin,
  onUnpin,
  className = '',
}) => {
  const isPinned = pinSummary.isPinnedByMe;
  const pinCount = pinSummary.pinnedBy.length;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPinned) {
      onUnpin();
    } else {
      onPin('group');
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title={isPinned ? 'Unpin from watchlist' : 'Save for later (pin to watchlist)'}
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold border transition-all cursor-pointer ${
        isPinned
          ? 'bg-primary/10 border-primary text-primary'
          : 'bg-surface border-border text-muted hover:text-foreground hover:bg-border/30'
      } ${className}`}
    >
      <span>{isPinned ? '📌' : '📍'}</span>
      {pinCount > 0 && <span>{pinCount}</span>}
    </button>
  );
};

