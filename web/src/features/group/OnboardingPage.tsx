import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { groupApi } from './api';
import { useAuthStore } from '../../stores/authStore';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { initSocket } from '../../lib/socket';
import { GroupPreview } from '../../types/api';

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const setGroup = useAuthStore((s) => s.setGroup);

  const [createName, setCreateName] = React.useState('');
  const [isCreating, setIsCreating] = React.useState(false);

  const [joinCode, setJoinCode] = React.useState('');
  const [isJoining, setIsJoining] = React.useState(false);
  const [preview, setPreview] = React.useState<GroupPreview | null>(null);
  const [previewError, setPreviewError] = React.useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim()) return;

    setIsCreating(true);
    try {
      const newGroup = await groupApi.createGroup(createName.trim());
      setGroup(newGroup);
      initSocket();
      toast.success(`Group "${newGroup.name}" created!`);
      navigate('/');
    } catch (err: any) {
      toast.error(err.message || 'Failed to create group');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const code = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
    setJoinCode(code);
    setPreviewError(null);

    if (code.length === 8) {
      try {
        const p = await groupApi.previewInvite(code);
        setPreview(p);
      } catch (err: any) {
        setPreview(null);
        setPreviewError(err.message || 'Invalid invite code');
      }
    } else {
      setPreview(null);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCode.length !== 8) return;

    setIsJoining(true);
    try {
      const joined = await groupApi.joinGroup(joinCode);
      setGroup(joined);
      initSocket();
      toast.success(`Joined "${joined.name}"!`);
      navigate('/');
    } catch (err: any) {
      toast.error(err.message || 'Failed to join group');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 select-none">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center">
          <span className="text-4xl">🚀</span>
          <h2 className="text-2xl font-bold text-foreground mt-2">Welcome to SyncMate</h2>
          <p className="text-sm text-muted mt-1">
            Create a shared group calendar or join an existing team
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Create Group Card */}
          <Card className="p-6 flex flex-col justify-between border-border">
            <div>
              <div className="text-2xl mb-2">✨</div>
              <h3 className="text-base font-bold text-foreground">Create a group</h3>
              <p className="text-xs text-muted mt-1 mb-4">
                Start a new shared calendar for up to 5 members and invite your team.
              </p>
              <form onSubmit={handleCreate} className="space-y-3">
                <Input
                  label="Group Name"
                  placeholder="Team Alpha"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  autoFocus
                />
                <Button type="submit" loading={isCreating} className="w-full">
                  Create Group
                </Button>
              </form>
            </div>
          </Card>

          {/* Join Group Card */}
          <Card className="p-6 flex flex-col justify-between border-border">
            <div>
              <div className="text-2xl mb-2">🔑</div>
              <h3 className="text-base font-bold text-foreground">Join with code</h3>
              <p className="text-xs text-muted mt-1 mb-4">
                Enter an 8-character invite code from your teammate.
              </p>
              <form onSubmit={handleJoin} className="space-y-3">
                <Input
                  label="Invite Code"
                  placeholder="DEMO1234"
                  value={joinCode}
                  onChange={handleCodeChange}
                  maxLength={8}
                  className="font-mono uppercase tracking-wider"
                />

                {preview && (
                  <div className="rounded-md border border-primary/30 bg-primary/5 p-2.5 text-center text-xs">
                    <p className="font-bold text-primary">{preview.groupName}</p>
                    <p className="text-muted">
                      {preview.memberCount} of {preview.maxMembers} members
                    </p>
                  </div>
                )}

                {previewError && (
                  <p className="text-xs text-priority-high">{previewError}</p>
                )}

                <Button
                  type="submit"
                  loading={isJoining}
                  disabled={joinCode.length !== 8}
                  variant="secondary"
                  className="w-full"
                >
                  Join Group
                </Button>
              </form>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
