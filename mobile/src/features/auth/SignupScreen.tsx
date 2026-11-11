import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AuthStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme/useTheme';
import { SPACING, TYPOGRAPHY } from '../../theme/tokens';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { ServerWakeupBanner } from '../../components/common/ServerWakeupBanner';
import { signupSchema, SignupFormData } from './schema';
import { authApi } from './api';
import { useAuthStore } from '../../stores/authStore';
import {
  formatElapsedTimer,
  startServerWarmup,
  useServerStatusStore,
} from '../../lib/serverStatus';
import { initSocket } from '../../lib/socket';
import { registerForPushNotifications } from '../../lib/push';

type Props = NativeStackScreenProps<AuthStackParamList, 'Signup'>;

export const SignupScreen: React.FC<Props> = ({ navigation }) => {
  const { theme } = useTheme();
  const setSession = useAuthStore((s) => s.setSession);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const hasAcceptedFirstRequest = useServerStatusStore((s) => s.hasAcceptedFirstRequest);
  const elapsedSeconds = useServerStatusStore((s) => s.elapsedSeconds);

  useEffect(() => {
    void startServerWarmup();
  }, []);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    setServerError(null);
    try {
      const res = await authApi.signup(data);
      await setSession(res.user, null, res.accessToken, res.refreshToken);

      await initSocket();
      registerForPushNotifications();
    } catch (err: any) {
      setServerError(err.message || 'Signup failed. Please try a different email.');
    } finally {
      setIsLoading(false);
    }
  };

  const buttonTitle = isLoading
    ? !hasAcceptedFirstRequest && elapsedSeconds >= 2
      ? `Waking server (${formatElapsedTimer(elapsedSeconds)})...`
      : 'Creating account...'
    : 'Create account';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: theme.bg }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Create account</Text>
          <Text style={[styles.subtitle, { color: theme.muted }]}>
            Join your team or create a new group calendar
          </Text>
        </View>

        <ServerWakeupBanner />

        {serverError && (
          <View style={[styles.errorBox, { backgroundColor: `${theme.destructive}1A`, borderColor: theme.destructive }]}>
            <Text style={[styles.errorText, { color: theme.destructive }]}>{serverError}</Text>
          </View>
        )}

        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Full name"
              placeholder="Alex Rivers"
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={errors.name?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Email address"
              placeholder="alex@syncmate.dev"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={errors.email?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Password (min 8 characters)"
              placeholder="••••••••"
              secureTextEntry
              autoCapitalize="none"
              autoComplete="new-password"
              textContentType="newPassword"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={errors.password?.message}
            />
          )}
        />

        <Button
          title={buttonTitle}
          onPress={handleSubmit(onSubmit)}
          loading={isLoading}
          variant="primary"
          size="lg"
          style={styles.submitBtn}
        />

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.muted }]}>Already have an account? </Text>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => navigation.navigate('Login')}
            style={styles.linkTouch}
          >
            <Text style={[styles.linkText, { color: theme.primary }]}>Sign in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xxl,
    justifyContent: 'center',
  },
  header: {
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: TYPOGRAPHY.xxl,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sm,
    lineHeight: 20,
  },
  errorBox: {
    borderWidth: 1,
    padding: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.lg,
  },
  errorText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: '500',
  },
  submitBtn: {
    marginTop: SPACING.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  footerText: {
    fontSize: TYPOGRAPHY.sm,
  },
  linkTouch: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  linkText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: '600',
  },
});

