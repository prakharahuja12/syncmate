import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { SOCKET_URL } from './constants';
import { queryClient } from './queryClient';
import { useAuthStore } from '../stores/authStore';
import { useUiStore } from '../stores/uiStore';
import { EventItem, NotificationItem } from '../types/api';

let socket: Socket | null = null;

export const getSocket = (): Socket | null => socket;

export const initSocket = (): Socket | null => {
  const token = useAuthStore.getState().accessToken;
  const group = useAuthStore.getState().group;

  if (!token || !group) {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
    return null;
  }

  if (socket && socket.connected) {
    return socket;
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
  });

  socket.on('event:created', (newEvent: EventItem) => {
    const currentUserId = useAuthStore.getState().user?.id;
    queryClient.invalidateQueries({ queryKey: ['events'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });

    if (newEvent.createdBy.id !== currentUserId) {
      toast.info(`${newEvent.createdBy.name} added an event`, {
        description: newEvent.title,
      });
    }
  });

  socket.on('event:updated', (updatedEvent: EventItem) => {
    queryClient.invalidateQueries({ queryKey: ['events'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['event', updatedEvent.id] });
  });

  socket.on('event:deleted', ({ id }: { id: string }) => {
    queryClient.invalidateQueries({ queryKey: ['events'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    queryClient.removeQueries({ queryKey: ['event', id] });
    toast.info('An event was removed from the calendar');
  });

  socket.on('event:completed', () => {
    queryClient.invalidateQueries({ queryKey: ['events'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
  });

  socket.on('pin:changed', () => {
    queryClient.invalidateQueries({ queryKey: ['watchlist'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['events'] });
  });

  socket.on('status:changed', () => {
    queryClient.invalidateQueries({ queryKey: ['watchlist'] });
    queryClient.invalidateQueries({ queryKey: ['events'] });
  });

  socket.on('notification:new', (notification: NotificationItem) => {
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    useUiStore.getState().incrementUnreadCount();

    toast.info(notification.title, {
      description: notification.body,
    });
  });

  socket.on('activity:new', () => {
    queryClient.invalidateQueries({ queryKey: ['activity'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  });

  socket.on('group:member-joined', () => {
    queryClient.invalidateQueries({ queryKey: ['group'] });
  });

  socket.on('group:member-left', () => {
    queryClient.invalidateQueries({ queryKey: ['group'] });
  });

  socket.on('group:deleted', () => {
    useAuthStore.getState().setGroup(null);
    toast.error('The group has been deleted by its owner');
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

