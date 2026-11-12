import * as React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  MoreHorizontal,
  Eye,
  ExternalLink,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { eventsApi } from '../../features/events/api';
import { useAuthStore } from '../../stores/authStore';
import { useDismissibleMenu } from '../../lib/useDismissibleMenu';
import { EventItem } from '../../types/api';

export interface TaskActionMenuProps {
  event: EventItem;
  onViewDetails: (eventId: string) => void;
  onToggleComplete?: (event: EventItem) => void;
  extraItems?: (closeMenu: () => void) => React.ReactNode;
  ariaLabel?: string;
}

export const TaskActionMenu: React.FC<TaskActionMenuProps> = ({
  event,
  onViewDetails,
  onToggleComplete,
  extraItems,
  ariaLabel = 'Task options',
}) => {
  const menu = useDismissibleMenu();
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const currentGroupOwnerId = useAuthStore((s) => s.group?.ownerId);

  const canDelete =
    !currentUserId ||
    event.createdBy?.id === currentUserId ||
    currentGroupOwnerId === currentUserId;

  const primaryUrl = event.primaryUrl || event.hackathon?.registrationUrl || event.url;
  const isCompleted = event.status === 'completed';

  const deleteMutation = useMutation({
    mutationFn: () => eventsApi.deleteEvent(event.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
      queryClient.invalidateQueries({ queryKey: ['activity'] });
      toast.success(`Deleted "${event.title}"`);
      menu.close();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Only the creator or team owner can delete this task');
    },
  });

  const handleDeleteClick = () => {
    if (!canDelete) {
      toast.error('Only the creator or team owner can delete this task');
      return;
    }
    if (confirm(`Delete "${event.title}" permanently for all team members?`)) {
      deleteMutation.mutate();
    }
  };

  return (
    <div
      ref={menu.containerRef}
      className="relative shrink-0"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={menu.toggle}
        aria-label={ariaLabel}
        aria-expanded={menu.isOpen}
        aria-haspopup="menu"
        className="text-muted hover:text-foreground hover:bg-surface p-1.5 rounded-lg transition-colors cursor-pointer"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {menu.isOpen && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1.5 z-50 w-52 rounded-xl border border-border bg-card shadow-xl p-1.5 space-y-1"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              menu.close();
              onViewDetails(event.id);
            }}
            className="w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-foreground hover:bg-surface transition-colors cursor-pointer"
          >
            <Eye className="h-3.5 w-3.5 text-muted" />
            <span>View details</span>
          </button>

          {primaryUrl && (
            <a
              href={primaryUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={menu.close}
              className="w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-foreground hover:bg-surface transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5 text-muted" />
              <span>Open registration page</span>
            </a>
          )}

          {onToggleComplete && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                menu.close();
                onToggleComplete(event);
              }}
              className="w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-foreground hover:bg-surface transition-colors cursor-pointer"
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>{isCompleted ? 'Mark active' : 'Mark complete'}</span>
            </button>
          )}

          {extraItems && extraItems(menu.close)}

          <div className="my-1 border-t border-border/70" />

          <button
            type="button"
            role="menuitem"
            disabled={deleteMutation.isPending}
            onClick={handleDeleteClick}
            className={`w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
              canDelete
                ? 'text-red-400 hover:bg-red-500/10'
                : 'text-muted/60 hover:bg-surface'
            }`}
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>{deleteMutation.isPending ? 'Deleting...' : 'Delete task'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
