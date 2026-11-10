import { io, Socket } from 'socket.io-client';
import { AppState, AppStateStatus } from 'react-native';
import Toast from 'react-native-toast-message';
import { SOCKET_URL } from './constants';
import { secureStorage } from './secureStorage';
import { queryClient } from './queryClient';
import { useAuthStore } from '../stores/authStore';
import { useUiStore } from '../stores/uiStore';
import { EventItem, NotificationItem } from '../types/api';

let socket: Socket | null = null;
let backgroundTimer: NodeJS.Timeout | null = null;

export const getSocket = (): Socket | null => socket;

export const initSocket = async (): Promise<Socket | null> => {
  const token = await secureStorage.getAccessToken();
  const currentGroup = useAuthStore.getState().group;

  if (!token || !currentGroup) {
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
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 10,
  });

  socket.on('connect', () => {
    // console.log('Socket connected');
  });

  socket.on('connect_error', async (err) => {
    if (err.message === 'UNAUTHORIZED' || err.message.includes('token')) {
      const newToken = await secureStorage.getAccessToken();
      if (newToken && socket) {
        socket.auth = { token: newToken };
        socket.connect();
      }
    }
  });

  // Realtime event handlers
  socket.on('event:created', (newEvent: EventItem) => {
    const currentUserId = useAuthStore.getState().user?.id;
    queryClient.invalidateQueries({ queryKey: ['events'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });

    if (newEvent.createdBy.id !== currentUserId) {
      Toast.show({
        type: 'info',
        text1: `${newEvent.createdBy.name} added an event`,
        text2: newEvent.title,
        onPress: () => {
          useUiStore.getState().setPendingDeepLink(`syncmate://event/${newEvent.id}`);
        },
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
  });

  socket.on('event:completed', (completedEvent: EventItem) => {
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

    Toast.show({
      type: 'info',
      text1: notification.title,
      text2: notification.body,
      onPress: () => {
        if (notification.data?.deepLink) {
          useUiStore.getState().setPendingDeepLink(notification.data.deepLink);
        }
      },
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

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Lifecycle management: disconnect after 30s background, reconnect on foreground
AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
  if (nextAppState === 'background') {
    backgroundTimer = setTimeout(() => {
      disconnectSocket();
    }, 30000);
  } else if (nextAppState === 'active') {
    if (backgroundTimer) {
      clearTimeout(backgroundTimer);
      backgroundTimer = null;
    }
    const isAuth = useAuthStore.getState().isAuthenticated;
    if (isAuth) {
      initSocket();
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  }
});

