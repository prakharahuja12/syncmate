import * as React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { groupApi } from './api';
import { useTeamActions } from './useTeamActions';
import { useAuthStore } from '../../stores/authStore';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { GroupPreview } from '../../types/api';

export const JoinGroupPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { applyActiveGroup } = useTeamActions();

  const [preview, setPreview] = React.useState<GroupPreview | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isJoining, setIsJoining] = React.useState(false);

  React.useEffect(() => {
    if (!code) return;

    groupApi
      .previewInvite(code.toUpperCase())
      .then((data) => {
        setPreview(data);
        setError(null);
      })
      .catch((err) => {
        if (err.code === 'INVITE_INVALID') {
          setError('This invite link is invalid or has expired.');
        } else if (err.code === 'GROUP_FULL') {
          setError('This group is full (max 5 members).');
        } else {
          setError(err.message || 'Could not load group preview');
        }
      })
      .finally(() => setIsLoading(false));
  }, [code]);

  const handleJoin = async () => {
    if (!code) return;
    setIsJoining(true);
    try {
      const joined = await groupApi.joinGroup(code.toUpperCase());
      await applyActiveGroup(joined, `Joined "${joined.name}"!`);
      navigate('/');
    } catch (err: any) {
      toast.error(err.message || 'Failed to join group');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 select-none">
      <Card className="w-full max-w-sm p-6 sm:p-8 text-center border-border shadow-xl">
        <span className="text-4xl">👥</span>

        {isLoading ? (
          <p className="text-sm text-muted mt-4">Loading invitation...</p>
        ) : error ? (
          <div className="mt-4 space-y-3">
            <h3 className="text-base font-bold text-priority-high">Cannot Join Group</h3>
            <p className="text-xs text-muted">{error}</p>
            <Button onClick={() => navigate('/onboarding')} variant="secondary" size="sm">
              Back to Onboarding
            </Button>
          </div>
        ) : preview ? (
          <div className="mt-4 space-y-4">
            <h3 className="text-lg font-bold text-foreground">You've been invited!</h3>
            <div className="rounded-lg border border-border bg-surface p-3">
              <p className="text-base font-bold text-primary">{preview.groupName}</p>
              <p className="text-xs text-muted mt-1">
                {preview.memberCount} of {preview.maxMembers} members joined
              </p>
            </div>

            {isAuthenticated ? (
              <Button onClick={handleJoin} loading={isJoining} className="w-full">
                Accept & Join Group
              </Button>
            ) : (
              <div className="space-y-2 pt-2">
                <p className="text-xs text-muted">Please sign in or create an account to join.</p>
                <Link to="/login" className="block">
                  <Button className="w-full">Sign in</Button>
                </Link>
                <Link to="/signup" className="block">
                  <Button variant="secondary" className="w-full">
                    Create account
                  </Button>
                </Link>
              </div>
            )}
          </div>
        ) : null}
      </Card>
    </div>
  );
};

