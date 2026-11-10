import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Copy, RefreshCw, Share2, Trash2, LogOut } from 'lucide-react';
import { groupApi } from './api';
import { useAuthStore } from '../../stores/authStore';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Avatar } from '../../components/ui/avatar';
import { Skeleton } from '../../components/ui/skeleton';
import { ErrorState } from '../../components/common/ErrorState';
import { formatDate } from '../../lib/dates';

export const GroupPage: React.FC = () => {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const setGroup = useAuthStore((s) => s.setGroup);

  const { data: group, isLoading, error, refetch } = useQuery({
    queryKey: ['group'],
    queryFn: () => groupApi.getMyGroup(),
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

  const regenerateMutation = useMutation({
    mutationFn: () => groupApi.regenerateInvite(group!.id),
    onSuccess: (res) => {
      queryClient.setQueryData(['group'], (old: any) => ({ ...old, inviteCode: res.inviteCode }));
      toast.success('Invite code regenerated!');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) => groupApi.removeMember(group!.id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group'] });
      toast.success('Member removed');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const leaveMutation = useMutation({
    mutationFn: () => groupApi.leaveGroup(group!.id),
    onSuccess: () => {
      setGroup(null);
      toast.info('Left group');
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

  return (
    <div className="space-y-6 select-none max-w-4xl">
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

      {!isOwner && (
        <Button
          onClick={() => {
            if (confirm('Leave this group?')) leaveMutation.mutate();
          }}
          variant="destructive"
          size="sm"
          className="gap-1.5"
        >
          <LogOut className="h-3.5 w-3.5" />
          Leave Group
        </Button>
      )}
    </div>
  );
};
