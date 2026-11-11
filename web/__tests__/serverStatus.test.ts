import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import axios from 'axios';
import {
  formatElapsedTimer,
  getHealthEndpointUrl,
  startServerWarmup,
  useServerStatusStore,
} from '../src/lib/serverStatus';

describe('Render Cold-Start Server Status & Timer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useServerStatusStore.getState().reset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    useServerStatusStore.getState().reset();
  });

  it('formats elapsed seconds as MM:SS', () => {
    expect(formatElapsedTimer(0)).toBe('00:00');
    expect(formatElapsedTimer(9)).toBe('00:09');
    expect(formatElapsedTimer(42)).toBe('00:42');
    expect(formatElapsedTimer(65)).toBe('01:05');
  });

  it('derives /health root URL without /api/v1 prefix', () => {
    const url = getHealthEndpointUrl();
    expect(url.endsWith('/health')).toBe(true);
    expect(url.includes('/api/v1/health')).toBe(false);
  });

  it('increments elapsedSeconds each second until first request is accepted', () => {
    useServerStatusStore.getState().beginRequestTimer();
    expect(useServerStatusStore.getState().status).toBe('waking');
    expect(useServerStatusStore.getState().elapsedSeconds).toBe(0);

    vi.advanceTimersByTime(5000);
    expect(useServerStatusStore.getState().elapsedSeconds).toBe(5);

    useServerStatusStore.getState().markFirstRequestAccepted();
    expect(useServerStatusStore.getState().status).toBe('ready');
    expect(useServerStatusStore.getState().hasAcceptedFirstRequest).toBe(true);

    // Timer must stop advancing after first request is accepted
    vi.advanceTimersByTime(4000);
    expect(useServerStatusStore.getState().elapsedSeconds).toBe(5);
  });

  it('retries transient 502 cold-start responses during warmup and succeeds', async () => {
    const getSpy = vi
      .spyOn(axios, 'get')
      .mockRejectedValueOnce({
        isAxiosError: true,
        response: { status: 502 },
      })
      .mockResolvedValueOnce({
        status: 200,
        data: { success: true, data: { status: 'ok' } },
      });

    vi.spyOn(axios, 'isAxiosError').mockImplementation(
      (err: any) => Boolean(err && err.isAxiosError)
    );

    const warmupPromise = startServerWarmup(true);
    await vi.advanceTimersByTimeAsync(2600);
    const result = await warmupPromise;

    expect(result).toBe(true);
    expect(getSpy).toHaveBeenCalledTimes(2);
    expect(useServerStatusStore.getState().hasAcceptedFirstRequest).toBe(true);
    expect(useServerStatusStore.getState().status).toBe('ready');
  });
});

