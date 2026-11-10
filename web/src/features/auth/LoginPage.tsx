import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { loginSchema, LoginFormData } from './schema';
import { authApi } from './api';
import { useAuthStore } from '../../stores/authStore';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { initSocket } from '../../lib/socket';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [serverError, setServerError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    try {
      const res = await authApi.login(data);
      const meRes = await authApi.getMe();
      setSession(res.user, meRes.group, res.accessToken, res.refreshToken);

      initSocket();
      toast.success(`Welcome back, ${res.user.name}!`);

      if (!meRes.group) {
        navigate('/onboarding');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setServerError(err.message || 'Invalid email or password');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 select-none">
      <Card className="w-full max-w-sm p-6 sm:p-8 border-border shadow-xl">
        <div className="text-center mb-6">
          <span className="text-3xl">📅</span>
          <h2 className="text-xl font-bold text-foreground mt-2">Sign in to SyncMate</h2>
          <p className="text-xs text-muted mt-1">Shared group calendar for fast-moving teams</p>
        </div>

        {serverError && (
          <div className="mb-4 rounded-md border border-priority-high/40 bg-priority-high/10 p-3 text-xs font-semibold text-priority-high">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Email address"
            type="email"
            placeholder="alex@demo.com"
            error={errors.email?.message}
            {...register('email')}
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password')}
          />

          <Button type="submit" loading={isSubmitting} className="w-full">
            Sign in
          </Button>
        </form>

        <div className="mt-6 text-center text-xs text-muted">
          Don't have an account?{' '}
          <Link to="/signup" className="font-semibold text-primary hover:underline">
            Sign up
          </Link>
        </div>
      </Card>
    </div>
  );
};

