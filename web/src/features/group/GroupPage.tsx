import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Copy,
  RefreshCw,
  Share2,
  Trash2,
  LogOut,
  Plus,
  UserPlus,
  Check,
  ArrowRightLeft,
  Users,
} from 'lucide-react';
import { groupApi } from './api';
import { useTeamActions } from './useTeamActions';
import { useAuthStore } from '../../stores/authStore';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Avatar } from '../../components/ui/avatar';
import { Skeleton } from '../../components/ui/skeleton';
import { ErrorState } from '../../components/common/ErrorState';
import { formatDate } from '../../lib/dates';
import { GroupPreview } from '../../types/api';

export const GroupPage: React.FC = () => {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const { applyActiveGroup, switchToTeam, syncAfterMembershipRemoval } = useTeamActions();

  const [activePanel, setActivePanel] = React.useState<'none' | 'host' | 'join'>('none');
  const [newTeamName, setNewTeamName] = React.useState('');
  const [inviteInput, setInviteInput] = React.useState('');
  const [invitePreview, setInvitePreview] = React.useState<GroupPreview | null>(null);
  const [previewError, setPreviewError] = React.useState<string | null>(null);
  const [isPreviewing, setIsPreviewing] = React.useState(false);

  const { data: group, isLoading, error, refetch } = useQuery({
    queryKey: ['group'],
    queryFn: () => groupApi.getMyGroup(),
  });

  const { data: myGroups = [] } = useQuery({
    queryKey: ['groups'],
    queryFn: () => groupApi.listMyGroups(),
  });

  const isOwner = group?.ownerId === currentUser?.id;

  const copyCode = async () => {
    if (!group) return;
    await navigator.clipboard.writeText(group.inviteCode);
    toast.success('Invite code copied to clipboard!');
  };

  const copyLink = async () => {
    if (!group) return;
    const link = `${window.location.origin}/join/${group.inviteCode}`;
    await navigator.clipboard.writeText(link);
    toast.success('Invite link copied to clipboard!');
  };

  const hostMutation = useMutation({
    mutationFn: (name: string) => groupApi.createGroup(name.trim()),
    onSuccess: async (created) => {
      await applyActiveGroup(created, `Hosted new team "${created.name}"!`);
      setNewTeamName('');
      setActivePanel('none');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to host team'),
  });

  const joinMutation = useMutation({
    mutationFn: (code: string) => groupApi.joinGroup(code.trim().toUpperCase()),
    onSuccess: async (joined) => {
      await applyActiveGroup(joined, `Joined team "${joined.name}"!`);
      setInviteInput('');
      setInvitePreview(null);
      setPreviewError(null);
      setActivePanel('none');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to join team'),
  });

  const switchMutation = useMutation({
    mutationFn: (gid: string) => switchToTeam(gid),
    onError: (err: any) => toast.error(err.message || 'Failed to switch team'),
  });

  const handlePreviewCode = async (rawCode: string) => {
    const clean = rawCode.trim().toUpperCase();
    setInviteInput(clean);
    setInvitePreview(null);
    setPreviewError(null);

    if (clean.length === 8) {
      setIsPreviewing(true);
      try {
        const preview = await groupApi.previewInvite(clean);
        setInvitePreview(preview);
      } catch (err: any) {
        setPreviewError(err.message || 'Invalid invite code');
      } finally {
        setIsPreviewing(false);
      }
    }
  };

  const regenerateMutation = useMutation({
    mutationFn: () => groupApi.regenerateInvite(group!.id),
    onSuccess: (res) => {
      queryClient.setQueryData(['group'], (old: any) => ({ ...old, inviteCode: res.inviteCode }));
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      toast.success('Invite code regenerated!');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) => groupApi.removeMember(group!.id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group'] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      toast.success('Member removed');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const leaveMutation = useMutation({
    mutationFn: () => groupApi.leaveGroup(group!.id),
    onSuccess: async () => {
      await syncAfterMembershipRemoval('Left team');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () => groupApi.deleteGroup(group!.id),
    onSuccess: async () => {
      await syncAfterMembershipRemoval('Team deleted');
    },
    onError: (err: any) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !group) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  const teamsToDisplay = myGroups.length > 0 ? myGroups : [group];

  return (
    <div className="space-y-6 select-none max-w-4xl">
      {/* Multi-Team Switcher + Host / Join Another Team */}
      <Card className="p-4 sm:p-5 border-border space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <span>Your Teams ({teamsToDisplay.length})</span>
            </h2>
            <p className="text-xs text-muted mt-0.5">
              Switch between teams, host a new team, or join another team using an invite code.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant={activePanel === 'host' ? 'primary' : 'secondary'}
              onClick={() => setActivePanel((p) => (p === 'host' ? 'none' : 'host'))}
              className="gap-1.5 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Host another team</span>
            </Button>

            <Button
              type="button"
              size="sm"
              variant={activePanel === 'join' ? 'primary' : 'outline'}
              onClick={() => setActivePanel((p) => (p === 'join' ? 'none' : 'join'))}
              className="gap-1.5 text-xs"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Join another team</span>
            </Button>
          </div>
        </div>

        {/* Inline Host New Team Form */}
        {activePanel === 'host' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!newTeamName.trim()) {
                toast.error('Please enter a team name');
                return;
              }
              hostMutation.mutate(newTeamName);
            }}
            className="rounded-xl border border-primary/30 bg-surface p-4 space-y-3"
          >
            <p className="text-xs font-bold text-foreground">Host a new team</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                placeholder="e.g. SIH Finalists 2026"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                maxLength={100}
              />
              <Button
                type="submit"
                loading={hostMutation.isPending}
                className="sm:w-auto shrink-0"
              >
                Create & Switch
              </Button>
            </div>
          </form>
        )}

        {/* Inline Join Another Team Form */}
        {activePanel === 'join' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (inviteInput.trim().length !== 8) {
                toast.error('Please enter an 8-character invite code');
                return;
              }
              joinMutation.mutate(inviteInput);
            }}
            className="rounded-xl border border-primary/30 bg-surface p-4 space-y-3"
          >
            <p className="text-xs font-bold text-foreground">Join another team</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                placeholder="8-character invite code (e.g. DEMO1234)"
                value={inviteInput}
                onChange={(e) => void handlePreviewCode(e.target.value)}
                maxLength={8}
                className="uppercase font-mono tracking-widest"
              />
              <Button
                type="submit"
                loading={joinMutation.isPending}
                disabled={inviteInput.trim().length !== 8}
                className="sm:w-auto shrink-0"
              >
                Join & Switch
              </Button>
            </div>

            {isPreviewing && <p className="text-xs text-muted">Checking invite code...</p>}
            {previewError && <p className="text-xs text-priority-high">{previewError}</p>}
            {invitePreview && (
              <div className="rounded-lg border border-border bg-card p-2.5 text-xs flex items-center justify-between">
                <span className="font-bold text-foreground">{invitePreview.groupName}</span>
                <span className="text-muted">
                  {invitePreview.memberCount} / {invitePreview.maxMembers} members
                </span>
              </div>
            )}
          </form>
        )}

        {/* Team List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {teamsToDisplay.map((team) => {
            const isCurrent = team.id === group.id;
            const amOwner = team.ownerId === currentUser?.id;

            return (
              <div
                key={team.id}
                className={`flex items-center justify-between gap-3 rounded-xl border p-3 transition-colors ${
                  isCurrent
                    ? 'border-primary/40 bg-primary/5'
                    : 'border-border bg-surface hover:border-primary/30'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-foreground truncate">{team.name}</p>
                    <span className="rounded-full border border-border bg-card px-2 py-0.5 text-[10px] font-semibold text-muted">
                      {amOwner ? 'Owner' : 'Member'}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted mt-0.5">
                    {team.members.length} / {team.maxMembers} members
                  </p>
                </div>

                {isCurrent ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 text-primary px-2.5 py-1 text-[11px] font-bold shrink-0">
                    <Check className="h-3 w-3" />
                    Active
                  </span>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    loading={switchMutation.isPending}
                    onClick={() => switchMutation.mutate(team.id)}
                    className="gap-1 text-xs shrink-0"
                  >
                    <ArrowRightLeft className="h-3 w-3" />
                    Switch
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Active Team Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">{group.name}</h1>
        <p className="text-xs text-muted mt-1">
          {group.members.length} of {group.maxMembers} members
        </p>
      </div>

      {/* Invite Panel (Owner) */}
      {isOwner && (
        <Card className="p-4 sm:p-5 border-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-muted uppercase tracking-wider">Group Invite Code</p>
              <p className="text-2xl font-extrabold font-mono text-primary tracking-widest mt-1">
                {group.inviteCode}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={copyCode} variant="secondary" size="sm" className="gap-1.5">
                <Copy className="h-3.5 w-3.5" />
                Copy code
              </Button>
              <Button onClick={copyLink} variant="secondary" size="sm" className="gap-1.5">
                <Share2 className="h-3.5 w-3.5" />
                Copy link
              </Button>
              <Button
                onClick={() => {
                  if (confirm('Regenerate invite code? Existing links will stop working.')) {
                    regenerateMutation.mutate();
                  }
                }}
                variant="outline"
                size="sm"
                className="gap-1.5 text-muted hover:text-foreground"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Regenerate
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Members List */}
      <div>
        <h2 className="text-sm font-bold text-foreground mb-3">Group Members</h2>
        <div className="divide-y divide-border rounded-xl border border-border bg-card overflow-hidden">
          {group.members.map((member) => {
            const isMe = member.id === currentUser?.id;
            const memberIsOwner = member.role === 'owner';

            return (
              <div key={member.id} className="flex items-center justify-between p-3.5 sm:px-4">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar user={member} size="md" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-foreground truncate">{member.name}</p>
                      {isMe && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.2 text-[10px] font-bold text-primary">
                          You
                        </span>
                      )}
                      {memberIsOwner && (
                        <span className="rounded-full bg-surface px-2 py-0.2 text-[10px] font-bold text-muted border border-border">
                          Owner
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted truncate">{member.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-muted hidden sm:inline">
                    Joined {formatDate(member.joinedAt, 'MMM d, yyyy')}
                  </span>
                  {isOwner && !isMe && (
                    <button
                      onClick={() => {
                        if (confirm(`Remove ${member.name} from group?`)) {
                          removeMemberMutation.mutate(member.id);
                        }
                      }}
                      className="text-xs text-priority-high hover:underline p-1"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Leave / Delete Active Team */}
      <div className="flex flex-wrap gap-3">
        {!isOwner && (
          <Button
            onClick={() => {
              if (confirm(`Leave "${group.name}"?`)) leaveMutation.mutate();
            }}
            variant="destructive"
            size="sm"
            loading={leaveMutation.isPending}
            className="gap-1.5"
          >
            <LogOut className="h-3.5 w-3.5" />
            Leave Team
          </Button>
        )}

        {isOwner && (
          <Button
            onClick={() => {
              if (
                confirm(
                  `Delete "${group.name}" permanently? All events and pins inside this team will be deleted.`
                )
              ) {
                deleteMutation.mutate();
              }
            }}
            variant="destructive"
            size="sm"
            loading={deleteMutation.isPending}
            className="gap-1.5"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete Team
          </Button>
        )}
      </div>
    </div>
  );
};
