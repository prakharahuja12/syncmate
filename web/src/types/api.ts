/**
 * SyncMate Web API Contract Types
 * Strict TypeScript types mirroring API_CONTRACT.md and DATA_MODEL.md.
 * No `any` allowed.
 */

export interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiErrorDetail {
  path: string;
  message: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code:
      | 'VALIDATION_ERROR'
      | 'UNAUTHORIZED'
      | 'TOKEN_EXPIRED'
      | 'FORBIDDEN'
      | 'NOT_FOUND'
      | 'CONFLICT'
      | 'GROUP_FULL'
      | 'INVITE_INVALID'
      | 'RATE_LIMITED'
      | 'INTERNAL';
    message: string;
    details?: ApiErrorDetail[];
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
}

export interface UserSettings {
  theme?: 'light' | 'dark' | 'system';
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  inAppNotifications?: boolean;
  defaultReminderOffsets?: number[];
}

export interface UserSummary {
  id: string;
  name: string;
  avatarColor?: string;
  email?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarColor: string;
  timezone: string;
  groupId: string | null;
  settings: UserSettings;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

export interface AuthMeResponse {
  user: User;
  group: Group | null;
}

export interface GroupMember {
  id: string;
  name: string;
  email: string;
  avatarColor: string;
  role: 'owner' | 'member';
  joinedAt: string;
}

export interface Group {
  id: string;
  name: string;
  inviteCode: string;
  ownerId: string;
  maxMembers: number;
  members: GroupMember[];
  createdAt: string;
  updatedAt: string;
}

export interface GroupPreview {
  groupName: string;
  memberCount: number;
  maxMembers: number;
}

export type EventKind = 'event' | 'task' | 'deadline';
export type EventCategory =
  | 'hackathon'
  | 'college'
  | 'personal'
  | 'meeting'
  | 'competition'
  | 'other';
export type EventPriority = 'high' | 'medium' | 'low';
export type EventStatus = 'pending' | 'completed';
export type HackathonMode = 'online' | 'offline' | 'hybrid';

export interface HackathonMetadata {
  name: string;
  registrationUrl?: string;
  officialUrl?: string;
  problemStatementUrl?: string;
  registrationOpensAt?: string;
  registrationClosesAt?: string;
  prizePool?: string;
  location?: string;
  mode?: HackathonMode;
  details?: string;
}

export type PinVisibility = 'group' | 'private';

export interface PinnedByUser {
  user: UserSummary;
  pinnedAt: string;
  visibility: PinVisibility;
}

export interface PinSummary {
  pinnedBy: PinnedByUser[];
  isPinnedByMe: boolean;
}

export type ParticipationStatus =
  | 'interested'
  | 'planning'
  | 'registered'
  | 'not_interested';

export interface ParticipationRecord {
  user: UserSummary;
  status: ParticipationStatus | null;
  updatedAt?: string;
}

export type ReminderAnchor = 'start' | 'registrationClose';

export interface ReminderItem {
  id?: string;
  anchor: ReminderAnchor;
  offsetMinutes?: number;
  customAt?: string | null;
}

export interface CalendarMarker {
  type: 'registrationClose';
  at: string;
}

export interface EventItem {
  id: string;
  groupId: string;
  kind: EventKind;
  title: string;
  description?: string;
  category: EventCategory;
  priority: EventPriority;
  startAt: string;
  endAt: string;
  allDay: boolean;
  url?: string;
  primaryUrl: string | null;
  assignedToAll: boolean;
  assignedTo: string[];
  status: EventStatus;
  completedAt: string | null;
  completedBy: UserSummary | null;
  createdBy: UserSummary;
  updatedBy: UserSummary;
  createdAt: string;
  updatedAt: string;
  hackathon?: HackathonMetadata;
  pinSummary: PinSummary;
  participation: ParticipationRecord[];
  myStatus: ParticipationStatus | null;
  myReminders: ReminderItem[];
  isUrgent: boolean;
  calendarMarkers?: CalendarMarker[];
}

export interface WatchlistItem extends EventItem {
  daysToRegistrationClose: number | null;
}

export interface WatchlistResponse {
  open: WatchlistItem[];
  closed: WatchlistItem[];
}

export type NotificationType =
  | 'event_created'
  | 'event_updated'
  | 'event_deleted'
  | 'event_completed'
  | 'reminder'
  | 'registration_deadline'
  | 'pin_added'
  | 'status_changed'
  | 'member_joined'
  | 'member_left'
  | 'google_sync_error';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: {
    eventId?: string;
    groupId?: string;
    deepLink?: string;
    collapseKey?: string;
  };
  actor: UserSummary | null;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationUnreadCountResponse {
  unreadCount: number;
}

export interface DashboardDeadline {
  event: EventItem;
  deadlineAt: string;
  deadlineType: 'event' | 'registration';
}

export interface DashboardStats {
  pending: number;
  completed: number;
  urgent: number;
  closingSoon?: number;
}

export interface ActivityItem {
  id: string;
  actor: UserSummary;
  action: string;
  eventId?: string;
  summary: string;
  createdAt: string;
}

export interface DashboardResponse {
  today: EventItem[];
  upcoming: EventItem[];
  deadlines: DashboardDeadline[];
  highPriority: EventItem[];
  nextHighPriority: EventItem | null;
  recentlyAdded: EventItem[];
  upcomingHackathons: EventItem[];
  watchlistClosingSoon: EventItem[];
  recentActivity: ActivityItem[];
  stats: DashboardStats;
}

export type GoogleSyncMode = 'all' | 'categories' | 'assigned_to_me' | 'none';

export interface GooglePreferences {
  mode: GoogleSyncMode;
  categories: EventCategory[];
  priorities: EventPriority[];
  includeRegistrationDeadlines: boolean;
}

export interface GoogleIntegrationStatus {
  connected: boolean;
  email?: string | null;
  calendarId?: string | null;
  preferences?: GooglePreferences;
  lastSyncAt?: string | null;
}

