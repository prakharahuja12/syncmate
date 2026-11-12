import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Check, Plus, Users } from 'lucide-react';
import { toast } from 'sonner';
import { groupApi } from '../../features/group/api';
import { useTeamActions } from '../../features/group/useTeamActions';
import { useAuthStore } from '../../stores/authStore';

export interface QuickTeamSwitcherProps {
  onSelect?: () => void;
}

export const QuickTeamSwitcher: React.FC<QuickTeamSwitcherProps> = ({ onSelect }) => {
  const navigate = useNavigate();
  const activeGroupId = useAuthStore((s) => s.group?.id);
  const { switchToTeam } = useTeamActions();
  const [switchingId, setSwitchingId] = React.useState<string | null>(null);

  const { data: teams = [] } = useQuery({
    queryKey: ['groups'],
    queryFn: () => groupApi.listMyGroups(),
    enabled: Boolean(activeGroupId),
  });

  const handleSwitch = async (gid: string) => {
    if (gid === activeGroupId) {
      onSelect?.();
      return;
    }
    setSwitchingId(gid);
    try {
      await switchToTeam(gid);
      onSelect?.();
    } catch (err: any) {
      toast.error(err.message || 'Could not switch team');
    } finally {
      setSwitchingId(null);
    }
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between px-2.5 py-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted flex items-center gap-1">
          <Users className="h-3 w-3" />
          <span>Teams ({teams.length || 1})</span>
        </span>
        <button
          type="button"
          onClick={() => {
            onSelect?.();
            navigate('/group');
          }}
          className="text-[10px] font-semibold text-primary hover:underline flex items-center gap-0.5 cursor-pointer"
        >
          <Plus className="h-3 w-3" />
          <span>Host / Join</span>
        </button>
      </div>

      {teams.length > 0 && (
        <div className="max-h-36 overflow-y-auto space-y-0.5">
          {teams.map((team) => {
            const isCurrent = team.id === activeGroupId;
            return (
              <button
                key={team.id}
                type="button"
                role="menuitem"
                disabled={switchingId === team.id}
                onClick={() => void handleSwitch(team.id)}
                className={`w-full flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-xs transition-colors cursor-pointer ${
                  isCurrent
                    ? 'bg-primary/15 text-primary font-bold'
                    : 'text-foreground hover:bg-surface font-medium'
                }`}
              >
                <span className="truncate">{team.name}</span>
                {isCurrent && <Check className="h-3.5 w-3.5 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

