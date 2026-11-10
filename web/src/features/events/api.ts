import { apiClient } from '../../lib/api';
import {
  ApiResponse,
  EventItem,
  EventCategory,
  EventPriority,
  EventStatus,
  EventKind,
  HackathonMetadata,
  ReminderItem,
  PinVisibility,
  ParticipationStatus,
} from '../../types/api';

export interface GetEventsParams {
  from: string;
  to: string;
  category?: EventCategory;
  priority?: EventPriority;
  status?: EventStatus;
  assignee?: string;
  q?: string;
  sort?: 'startAt' | 'priority' | 'createdAt';
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface CreateEventPayload {
  kind?: EventKind;
  title: string;
  description?: string;
  category: EventCategory;
  priority: EventPriority;
  startAt: string;
  endAt: string;
  allDay?: boolean;
  url?: string;
  assignedToAll?: boolean;
  assignedTo?: string[];
  hackathon?: HackathonMetadata;
  reminders?: ReminderItem[];
}

export interface UpdateEventPayload extends Partial<CreateEventPayload> {}

export const eventsApi = {
  async getEvents(groupId: string, params: GetEventsParams): Promise<EventItem[]> {
    const res = await apiClient.get<ApiResponse<EventItem[]>>(`/groups/${groupId}/events`, {
      params,
    });
    return res.data.data;
  },

  async getEventById(eventId: string): Promise<EventItem> {
    const res = await apiClient.get<ApiResponse<EventItem>>(`/events/${eventId}`);
    return res.data.data;
  },

  async createEvent(groupId: string, data: CreateEventPayload): Promise<EventItem> {
    const res = await apiClient.post<ApiResponse<EventItem>>(`/groups/${groupId}/events`, data);
    return res.data.data;
  },

  async updateEvent(eventId: string, data: UpdateEventPayload): Promise<EventItem> {
    const res = await apiClient.patch<ApiResponse<EventItem>>(`/events/${eventId}`, data);
    return res.data.data;
  },

  async deleteEvent(eventId: string): Promise<void> {
    await apiClient.delete(`/events/${eventId}`);
  },

  async completeEvent(eventId: string): Promise<EventItem> {
    const res = await apiClient.post<ApiResponse<EventItem>>(`/events/${eventId}/complete`);
    return res.data.data;
  },

  async uncompleteEvent(eventId: string): Promise<EventItem> {
    const res = await apiClient.post<ApiResponse<EventItem>>(`/events/${eventId}/uncomplete`);
    return res.data.data;
  },

  async setReminders(eventId: string, reminders: ReminderItem[]): Promise<ReminderItem[]> {
    const res = await apiClient.put<ApiResponse<ReminderItem[]>>(`/events/${eventId}/reminders`, {
      reminders,
    });
    return res.data.data;
  },

  async pinEvent(eventId: string, visibility: PinVisibility = 'group'): Promise<void> {
    await apiClient.post(`/events/${eventId}/pin`, { visibility });
  },

  async unpinEvent(eventId: string): Promise<void> {
    await apiClient.delete(`/events/${eventId}/pin`);
  },

  async setMyStatus(eventId: string, status: ParticipationStatus): Promise<void> {
    await apiClient.put(`/events/${eventId}/my-status`, { status });
  },
};
