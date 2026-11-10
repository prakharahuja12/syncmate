import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { signupSchema, SignupFormData } from './schema';
import { authApi } from './api';
import { useAuthStore } from '../../stores/authStore';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { initSocket } from '../../lib/socket';

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [serverError, setServerError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormData) => {
    setServerError(null);
    try {
      const res = await authApi.signup(data);
      setSession(res.user, null, res.accessToken, res.refreshToken);

      initSocket();
      toast.success('Account created successfully!');
      navigate('/onboarding');
    } catch (err: any) {
      setServerError(err.message || 'Could not create account');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 select-none">
      <Card className="w-full max-w-sm p-6 sm:p-8 border-border shadow-xl">
        <div className="text-center mb-6">
          <span className="text-3xl">📅</span>
          <h2 className="text-xl font-bold text-foreground mt-2">Create an account</h2>
          <p className="text-xs text-muted mt-1">Start collaborating on a single shared calendar</p>
        </div>

        {serverError && (
          <div className="mb-4 rounded-md border border-priority-high/40 bg-priority-high/10 p-3 text-xs font-semibold text-priority-high">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Full name"
            type="text"
            placeholder="Alex Rivers"
            error={errors.name?.message}
            {...register('name')}
          />

          <Input
            label="Email address"
            type="email"
            placeholder="alex@syncmate.dev"
            error={errors.email?.message}
            {...register('email')}
          />

          <Input
            label="Password (min 8 characters)"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password')}
          />

          <Button type="submit" loading={isSubmitting} className="w-full">
            Create account
          </Button>
        </form>

        <div className="mt-6 text-center text-xs text-muted">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </div>
      </Card>
    </div>
  );
};

