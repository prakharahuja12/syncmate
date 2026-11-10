import React, { useState } from 'react';
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
import { loginSchema, LoginFormData } from './schema';
import { authApi } from './api';
import { useAuthStore } from '../../stores/authStore';
import { initSocket } from '../../lib/socket';
import { registerForPushNotifications } from '../../lib/push';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const { theme } = useTheme();
  const setSession = useAuthStore((s) => s.setSession);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setServerError(null);
    try {
      const res = await authApi.login(data);
      // Fetch full me data with group info
      const meRes = await authApi.getMe();
      await setSession(res.user, meRes.group, res.accessToken, res.refreshToken);

      await initSocket();
      registerForPushNotifications();
    } catch (err: any) {
      setServerError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

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
          <Text style={[styles.title, { color: theme.text }]}>Welcome back</Text>
          <Text style={[styles.subtitle, { color: theme.muted }]}>
            Sign in to access your shared group calendar
          </Text>
        </View>

        {serverError && (
          <View style={[styles.errorBox, { backgroundColor: `${theme.destructive}1A`, borderColor: theme.destructive }]}>
            <Text style={[styles.errorText, { color: theme.destructive }]}>{serverError}</Text>
          </View>
        )}

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Email address"
              placeholder="alex@demo.com"
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
              label="Password"
              placeholder="••••••••"
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password"
              textContentType="password"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={errors.password?.message}
            />
          )}
        />

        <Button
          title="Sign in"
          onPress={handleSubmit(onSubmit)}
          loading={isLoading}
          variant="primary"
          size="lg"
          style={styles.submitBtn}
        />

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.muted }]}>Don't have an account? </Text>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => navigation.navigate('Signup')}
            style={styles.linkTouch}
          >
            <Text style={[styles.linkText, { color: theme.primary }]}>Sign up</Text>
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

