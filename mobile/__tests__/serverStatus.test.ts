import axios from 'axios';
import {
  formatElapsedTimer,
  getHealthEndpointUrl,
  startServerWarmup,
  useServerStatusStore,
} from '../src/lib/serverStatus';

describe('Mobile Render Cold-Start Server Status & Timer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    useServerStatusStore.getState().reset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
    useServerStatusStore.getState().reset();
  });

  it('formats elapsed seconds cleanly', () => {
    expect(formatElapsedTimer(0)).toBe('00:00');
    expect(formatElapsedTimer(15)).toBe('00:15');
    expect(formatElapsedTimer(75)).toBe('01:15');
  });

  it('derives /health endpoint without /api/v1 prefix', () => {
    const url = getHealthEndpointUrl();
    expect(url.endsWith('/health')).toBe(true);
    expect(url.includes('/api/v1/health')).toBe(false);
  });

  it('ticks elapsedSeconds until first request is accepted', () => {
    useServerStatusStore.getState().beginRequestTimer();
    expect(useServerStatusStore.getState().status).toBe('waking');
    expect(useServerStatusStore.getState().elapsedSeconds).toBe(0);

    jest.advanceTimersByTime(4000);
    expect(useServerStatusStore.getState().elapsedSeconds).toBe(4);

    useServerStatusStore.getState().markFirstRequestAccepted();
    expect(useServerStatusStore.getState().status).toBe('ready');
    expect(useServerStatusStore.getState().hasAcceptedFirstRequest).toBe(true);

    jest.advanceTimersByTime(3000);
    expect(useServerStatusStore.getState().elapsedSeconds).toBe(4);
  });

  it('retries 502 responses during warmup and succeeds when Render wakes', async () => {
    const getSpy = jest
      .spyOn(axios, 'get')
      .mockRejectedValueOnce({
        isAxiosError: true,
        response: { status: 502 },
      })
      .mockResolvedValueOnce({
        status: 200,
        data: { success: true },
      });

    jest.spyOn(axios, 'isAxiosError').mockImplementation(
      (err: any) => Boolean(err && err.isAxiosError)
    );

    const warmupPromise = startServerWarmup(true);
    await jest.advanceTimersByTimeAsync(2600);
    const result = await warmupPromise;

    expect(result).toBe(true);
    expect(getSpy).toHaveBeenCalledTimes(2);
    expect(useServerStatusStore.getState().hasAcceptedFirstRequest).toBe(true);
  });
});
