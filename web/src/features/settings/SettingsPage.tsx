import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  User,
  Palette,
  Bell,
  Calendar,
  Sun,
  Moon,
  Laptop,
  Save,
  Check,
} from 'lucide-react';
import { settingsApi } from './api';
import { GoogleCalendarCard } from './GoogleCalendarCard';
import { useAuthStore } from '../../stores/authStore';
import { useUiStore } from '../../stores/uiStore';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Avatar } from '../../components/ui/avatar';

const AVATAR_COLORS = [
  '#5B5BD6', // Primary Indigo
  '#E5484D', // Red
  '#F5A524', // Amber
  '#30A46C', // Green
  '#8E4EC6', // Purple
  '#3E63DD', // Blue
  '#D6409F', // Pink
  '#12A594', // Teal
  '#EC5E41', // Orange
  '#6B6B76', // Slate
];

export const SettingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);
  const tapHackathonOpensLink = useUiStore((s) => s.tapHackathonOpensLinkDirectly);
  const setTapHackathonOpensLink = useUiStore((s) => s.setTapHackathonOpensLinkDirectly);

  const [activeTab, setActiveTab] = React.useState<
    'profile' | 'appearance' | 'notifications' | 'integrations'
  >('profile');

  // Profile form state
  const [name, setName] = React.useState(currentUser?.name || '');
  const [avatarColor, setAvatarColor] = React.useState(currentUser?.avatarColor || '#5B5BD6');
  const [timezone, setTimezone] = React.useState(currentUser?.timezone || 'Asia/Kolkata');

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => settingsApi.getProfile(),
  });

  React.useEffect(() => {
    if (profile) {
      setName(profile.name);
      setAvatarColor(profile.avatarColor);
      setTimezone(profile.timezone);
    }
  }, [profile]);

  const profileMutation = useMutation({
    mutationFn: () =>
      settingsApi.updateProfile({
        name,
        avatarColor,
        timezone,
      }),
    onSuccess: (updated) => {
      setUser(updated);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Profile saved successfully');
    },
    onError: () => {
      toast.error('Failed to update profile');
    },
  });

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="text-sm text-muted mt-1">
          Manage your account profile, preferences, appearance, and integrations.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border space-x-6 text-sm font-semibold overflow-x-auto">
        {[
          { id: 'profile', label: 'Profile', icon: User },
          { id: 'appearance', label: 'Appearance', icon: Palette },
          { id: 'notifications', label: 'Notifications', icon: Bell },
          { id: 'integrations', label: 'Integrations', icon: Calendar },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-b-2 border-primary text-primary font-bold'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Profile */}
      {activeTab === 'profile' && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-6">
          <div className="flex items-center gap-4">
            <Avatar name={name || 'User'} color={avatarColor} size="lg" />
            <div>
              <h3 className="font-bold text-foreground text-base">{name || 'Your Name'}</h3>
              <p className="text-xs text-muted">{currentUser?.email}</p>
            </div>
          </div>

          <div className="space-y-4 max-w-md">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1.5">
                Full Name
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1.5">
                Email Address
              </label>
              <Input value={currentUser?.email || ''} disabled className="opacity-70 bg-surface" />
              <span className="text-[11px] text-muted block mt-1">
                Email is tied to your account login.
              </span>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1.5">
                Timezone
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm text-foreground focus:outline-none"
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-2">
                Avatar Color Swatch
              </label>
              <div className="flex flex-wrap items-center gap-2.5">
                {AVATAR_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setAvatarColor(c)}
                    className="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 flex items-center justify-center cursor-pointer shadow-xs"
                    style={{
                      backgroundColor: c,
                      borderColor: avatarColor === c ? 'white' : 'transparent',
                    }}
                  >
                    {avatarColor === c && <Check className="h-4 w-4 text-white" />}
                  </button>
                ))}
              </div>
            </div>

            <Button
              variant="primary"
              onClick={() => profileMutation.mutate()}
              isLoading={profileMutation.isPending}
            >
              <Save className="h-4 w-4 mr-1.5" />
              <span>Save Changes</span>
            </Button>
          </div>
        </div>
      )}

      {/* Tab 2: Appearance */}
      {activeTab === 'appearance' && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-6">
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-foreground">Theme Preference</h3>
            <p className="text-xs text-muted">
              Choose your preferred interface theme or synchronize automatically with system settings.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              {[
                { id: 'light', label: 'Light', icon: Sun, desc: 'Clean white surfaces' },
                { id: 'dark', label: 'Dark', icon: Moon, desc: 'Deep obsidian contrast' },
                { id: 'system', label: 'System', icon: Laptop, desc: 'Follows OS preference' },
              ].map((opt) => {
                const Icon = opt.icon;
                const isSelected = theme === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setTheme(opt.id as any)}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'border-border bg-surface hover:bg-surface/80'
                    }`}
                  >
                    <Icon className="h-5 w-5 text-primary mb-2" />
                    <span className="text-xs font-bold text-foreground block">{opt.label}</span>
                    <span className="text-[11px] text-muted block mt-0.5">{opt.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-border space-y-2">
            <h3 className="text-sm font-bold text-foreground">Hackathon Link Navigation</h3>
            <label className="flex items-start gap-3 p-3.5 rounded-xl border border-border bg-surface cursor-pointer">
              <input
                type="checkbox"
                checked={tapHackathonOpensLink}
                onChange={(e) => setTapHackathonOpensLink(e.target.checked)}
                className="mt-0.5 rounded border-border text-primary focus:ring-primary"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-foreground block">
                  Clicking a hackathon chip opens registration page directly
                </span>
                <span className="text-[11px] text-muted block">
                  When enabled, tapping a hackathon event in the calendar or dashboard immediately opens its registration link in a new tab. Event details remain accessible via the ⓘ button.
                </span>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* Tab 3: Notifications */}
      {activeTab === 'notifications' && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-6">
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-foreground">Notification Channels</h3>
            <p className="text-xs text-muted">
              Choose how you want to be notified about hackathons, team actions, and deadlines.
            </p>

            <div className="space-y-2 pt-2">
              <label className="flex items-center justify-between p-3 rounded-xl border border-border bg-surface cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-foreground block">In-App Notifications</span>
                  <span className="text-[11px] text-muted">
                    Show notification bell badges and realtime toasts
                  </span>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-border text-primary focus:ring-primary"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-border bg-surface cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-foreground block">Browser Web Push (FCM)</span>
                  <span className="text-[11px] text-muted">
                    Receive desktop notifications when deadlines approach
                  </span>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-border text-primary focus:ring-primary"
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Integrations */}
      {activeTab === 'integrations' && <GoogleCalendarCard />}
    </div>
  );
};
