import axios from 'axios';
import { create } from 'zustand';
import { API_BASE_URL } from './constants';

export type ServerWakeStatus = 'idle' | 'waking' | 'ready' | 'error';

export const ESTIMATED_COLD_START_SECONDS = 50;
const MAX_WARMUP_MS = 95000;
const RETRY_DELAY_MS = 2500;

interface ServerStatusState {
  status: ServerWakeStatus;
  hasAcceptedFirstRequest: boolean;
  startedAt: number | null;
  elapsedSeconds: number;
  lastError: string | null;
  beginRequestTimer: () => void;
  markFirstRequestAccepted: () => void;
  markWarmupError: (message: string) => void;
  reset: () => void;
}

let timerHandle: ReturnType<typeof setInterval> | null = null;
let warmupPromise: Promise<boolean> | null = null;

const stopTimer = () => {
  if (timerHandle !== null) {
    clearInterval(timerHandle);
    timerHandle = null;
  }
};

export const useServerStatusStore = create<ServerStatusState>((set, get) => ({
  status: 'idle',
  hasAcceptedFirstRequest: false,
  startedAt: null,
  elapsedSeconds: 0,
  lastError: null,

  beginRequestTimer: () => {
    const state = get();
    if (state.hasAcceptedFirstRequest) {
      return;
    }

    const startedAt = state.startedAt ?? Date.now();
    if (state.status !== 'waking' || state.startedAt === null) {
      set({
        status: 'waking',
        startedAt,
        elapsedSeconds: Math.max(0, Math.floor((Date.now() - startedAt) / 1000)),
        lastError: null,
      });
    }

    if (timerHandle === null) {
      timerHandle = setInterval(() => {
        const current = get();
        if (current.hasAcceptedFirstRequest || current.startedAt === null) {
          stopTimer();
          return;
        }
        set({
          elapsedSeconds: Math.max(0, Math.floor((Date.now() - current.startedAt) / 1000)),
        });
      }, 1000);
    }
  },

  markFirstRequestAccepted: () => {
    stopTimer();
    const state = get();
    if (state.hasAcceptedFirstRequest && state.status === 'ready') {
      return;
    }
    const elapsedSeconds =
      state.startedAt !== null
        ? Math.max(0, Math.floor((Date.now() - state.startedAt) / 1000))
        : state.elapsedSeconds;

    set({
      status: 'ready',
      hasAcceptedFirstRequest: true,
      elapsedSeconds,
      lastError: null,
    });
  },

  markWarmupError: (message: string) => {
    stopTimer();
    set({
      status: 'error',
      lastError: message,
    });
  },

  reset: () => {
    stopTimer();
    warmupPromise = null;
    set({
      status: 'idle',
      hasAcceptedFirstRequest: false,
      startedAt: null,
      elapsedSeconds: 0,
      lastError: null,
    });
  },
}));

export const formatElapsedTimer = (totalSeconds: number): string => {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export const getHealthEndpointUrl = (): string => {
  const origin = API_BASE_URL.replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '');
  return `${origin}/health`;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isTransientColdStartFailure = (err: unknown): boolean => {
  if (!axios.isAxiosError(err)) return false;
  if (!err.response) return true;
  return [502, 503, 504].includes(err.response.status);
};

export const startServerWarmup = async (force = false): Promise<boolean> => {
  const store = useServerStatusStore.getState();
  if (store.hasAcceptedFirstRequest && !force) {
    return true;
  }

  if (force) {
    stopTimer();
    warmupPromise = null;
    useServerStatusStore.setState({
      status: 'idle',
      hasAcceptedFirstRequest: false,
      startedAt: null,
      elapsedSeconds: 0,
      lastError: null,
    });
  }

  if (warmupPromise) {
    return warmupPromise;
  }

  warmupPromise = (async () => {
    const startTime = Date.now();
    useServerStatusStore.getState().beginRequestTimer();
    const healthUrl = getHealthEndpointUrl();

    while (!useServerStatusStore.getState().hasAcceptedFirstRequest) {
      const remainingMs = MAX_WARMUP_MS - (Date.now() - startTime);
      if (remainingMs <= 0) {
        useServerStatusStore
          .getState()
          .markWarmupError(
            'Server took longer than 90s to respond. Render may still be starting up—tap Retry.'
          );
        return false;
      }

      try {
        await axios.get(healthUrl, {
          timeout: Math.min(25000, remainingMs),
        });
        useServerStatusStore.getState().markFirstRequestAccepted();
        return true;
      } catch (err) {
        if (useServerStatusStore.getState().hasAcceptedFirstRequest) {
          return true;
        }
        if (!isTransientColdStartFailure(err)) {
          useServerStatusStore.getState().markFirstRequestAccepted();
          return true;
        }
        const elapsed = Date.now() - startTime;
        if (elapsed + RETRY_DELAY_MS >= MAX_WARMUP_MS) {
          useServerStatusStore
            .getState()
            .markWarmupError(
              'Server is still waking up after inactivity. Please tap Retry or submit again.'
            );
          return false;
        }
        await sleep(RETRY_DELAY_MS);
      }
    }

    return true;
  })().finally(() => {
    warmupPromise = null;
  });

  return warmupPromise;
};

