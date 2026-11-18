import { api, debounce, sleep } from './system';

// Builds a fetch Response (from the whatwg-fetch polyfill CRA loads in tests)
const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });

describe('api', () => {
  let fetchMock: jest.SpyInstance;

  beforeEach(() => {
    // Never hit the network: every test gets a fresh fake fetch
    fetchMock = jest.spyOn(window, 'fetch').mockResolvedValue(jsonResponse({}));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('uses the local mock API folder as its base URL', () => {
    expect(api.baseURL).toBe('./api');
  });

  describe('get()', () => {
    it('prefixes the endpoint with the base URL', async () => {
      await api.get('/session.json');
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock).toHaveBeenCalledWith('./api/session.json', { method: 'get' });
    });

    it('keeps query strings on the URL', async () => {
      await api.get('/messages.json?thread=Lisa');
      expect(fetchMock.mock.calls[0][0]).toBe('./api/messages.json?thread=Lisa');
    });

    it('uses the endpoint as-is for external URLs', async () => {
      await api.get('https://geolocation-db.com/json/', true);
      expect(fetchMock).toHaveBeenCalledWith('https://geolocation-db.com/json/', {
        method: 'get'
      });
    });

    it('sends no body or headers', async () => {
      await api.get('/friends.json');
      const options = fetchMock.mock.calls[0][1];
      expect(options).not.toHaveProperty('body');
      expect(options).not.toHaveProperty('headers');
    });

    it('resolves to [null, parsedJson] on success', async () => {
      const session = { session: { id: 'abc', username: 'Julia' } };
      fetchMock.mockResolvedValue(jsonResponse(session));
      await expect(api.get('/session.json')).resolves.toEqual([null, session]);
    });
  });

  describe('write methods', () => {
    const payload = { author: 'Julia', message: 'Hi!', count: 2, read: false };

    it.each(['post', 'put', 'patch'] as const)(
      '%s() sends the data as a JSON body with a JSON content type',
      async (method) => {
        await api[method]('/messages.json', payload);

        const [url, options] = fetchMock.mock.calls[0];
        expect(url).toBe('./api/messages.json');
        expect(options.method).toBe(method);
        expect(options.body).toBe(JSON.stringify(payload));
        expect(options.headers).toBeInstanceOf(Headers);
        expect(options.headers.get('Content-Type')).toBe('application/json');
      }
    );

    it('post() with null data sends no body', async () => {
      await api.post('/messages.json', null);
      expect(fetchMock).toHaveBeenCalledWith('./api/messages.json', { method: 'post' });
    });

    it('delete() sends a bodiless DELETE request', async () => {
      await api.delete('/messages/1.json');
      expect(fetchMock).toHaveBeenCalledWith('./api/messages/1.json', {
        method: 'delete'
      });
    });

    it('resolves to [null, parsedJson] on success', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ ok: true }));
      await expect(api.post('/messages.json', payload)).resolves.toEqual([
        null,
        { ok: true }
      ]);
    });
  });

  describe('error handling', () => {
    it('resolves to [error] instead of throwing when the network request fails', async () => {
      const networkError = new TypeError('Failed to fetch');
      fetchMock.mockRejectedValue(networkError);
      await expect(api.get('/session.json')).resolves.toEqual([networkError]);
    });

    it('resolves to [error] when the response is not valid JSON', async () => {
      // e.g. a dev server returning index.html for an unknown route
      fetchMock.mockResolvedValue(new Response('<!DOCTYPE html>', { status: 404 }));
      const result = await api.get('/missing.json');
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(SyntaxError);
    });

    it('does not treat a non-2xx status with a JSON body as an error (current behavior)', async () => {
      const body = { message: 'Not found' };
      fetchMock.mockResolvedValue(jsonResponse(body, 404));
      await expect(api.get('/missing.json')).resolves.toEqual([null, body]);
    });
  });
});

describe('debounce()', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('does not call the function before the wait time has passed', () => {
    const func = jest.fn();
    const debounced = debounce(func, 100);

    debounced();
    jest.advanceTimersByTime(99);

    expect(func).not.toHaveBeenCalled();
  });

  it('calls the function once the wait time has passed', () => {
    const func = jest.fn();
    const debounced = debounce(func, 100);

    debounced();
    jest.advanceTimersByTime(100);

    expect(func).toHaveBeenCalledTimes(1);
  });

  it('collapses rapid calls into a single call', () => {
    const func = jest.fn();
    const debounced = debounce(func, 100);

    debounced();
    debounced();
    debounced();
    jest.advanceTimersByTime(100);

    expect(func).toHaveBeenCalledTimes(1);
  });

  it('restarts the wait each time it is called', () => {
    const func = jest.fn();
    const debounced = debounce(func, 100);

    debounced();
    jest.advanceTimersByTime(60);
    debounced();
    jest.advanceTimersByTime(60);
    expect(func).not.toHaveBeenCalled();

    jest.advanceTimersByTime(40);
    expect(func).toHaveBeenCalledTimes(1);
  });

  it('passes the arguments from the last call', () => {
    const func = jest.fn();
    const debounced = debounce(func, 100);

    debounced('first');
    debounced('second', 2);
    jest.advanceTimersByTime(100);

    expect(func).toHaveBeenCalledTimes(1);
    expect(func).toHaveBeenCalledWith('second', 2);
  });

  it('can fire again after a previous call has completed', () => {
    const func = jest.fn();
    const debounced = debounce(func, 100);

    debounced();
    jest.advanceTimersByTime(100);
    debounced();
    jest.advanceTimersByTime(100);

    expect(func).toHaveBeenCalledTimes(2);
  });

  it('keeps separate timers for separate debounced functions', () => {
    const funcA = jest.fn();
    const funcB = jest.fn();
    const debouncedA = debounce(funcA, 100);
    const debouncedB = debounce(funcB, 100);

    debouncedA();
    debouncedB();
    jest.advanceTimersByTime(100);

    expect(funcA).toHaveBeenCalledTimes(1);
    expect(funcB).toHaveBeenCalledTimes(1);
  });
});

describe('sleep()', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // Let any already-resolved promise callbacks run
  const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

  it('returns a promise', () => {
    expect(sleep(10)).toBeInstanceOf(Promise);
  });

  it('schedules a timeout for the given number of milliseconds', () => {
    const setTimeoutSpy = jest.spyOn(window, 'setTimeout');
    sleep(1000);
    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 1000);
    setTimeoutSpy.mockRestore();
  });

  it('does not resolve before the time has passed', async () => {
    const done = jest.fn();
    sleep(1000).then(done);

    jest.advanceTimersByTime(999);
    await flushPromises();

    expect(done).not.toHaveBeenCalled();
  });

  it('resolves once the time has passed', async () => {
    const done = jest.fn();
    sleep(1000).then(done);

    jest.advanceTimersByTime(1000);
    await flushPromises();

    expect(done).toHaveBeenCalledTimes(1);
  });
});
