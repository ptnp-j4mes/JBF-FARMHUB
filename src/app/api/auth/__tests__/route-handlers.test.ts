import { beforeEach, describe, expect, it, vi } from 'vitest';

type CookieValue = { value: string };

const { cookieStore, fetchMock } = vi.hoisted(() => ({
  cookieStore: {
    get: vi.fn<(name: string) => CookieValue | undefined>(),
    set: vi.fn(),
  },
  fetchMock: vi.fn(),
}));

vi.mock('@/lib/server-api', () => ({
  API_SERVER_URL: 'http://backend.local',
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => cookieStore),
}));

vi.stubGlobal('fetch', fetchMock);

function resetCookieStore(values: Record<string, string> = {}) {
  cookieStore.get.mockImplementation((name: string) => {
    const value = values[name];
    return value ? { value } : undefined;
  });
  cookieStore.set.mockClear();
}

describe('auth route handlers', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    resetCookieStore();
  });

  it('login sets HttpOnly auth cookies and strips tokens from the response', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          token: 'access-token',
          refreshToken: 'refresh-token',
          expiresIn: 1800,
          user: {
            id: 1,
            username: 'demo',
            firstName: 'Demo',
            lastName: 'User',
            companyId: 1,
            companyName: 'FarmHUB',
            roles: [],
            roleCodes: [],
            requirePasswordReset: false,
          },
        }),
        {
          status: 200,
          headers: {
            'content-type': 'application/json',
          },
        },
      ),
    );

    const { POST } = await import('../login/route');
    const response = await POST(
      new Request('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: 'demo', password: 'Password123!' }),
      }),
    );
    const payload = (await response.json()) as Record<string, unknown>;

    expect(payload.token).toBeUndefined();
    expect(payload.refreshToken).toBeUndefined();
    expect(payload.expiresIn).toBe(1800);
    expect(cookieStore.set).toHaveBeenCalledWith(
      'accessToken',
      'access-token',
      expect.objectContaining({
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
        secure: false,
        expires: expect.any(Date),
      }),
    );
    expect(cookieStore.set).toHaveBeenCalledWith(
      'refreshToken',
      'refresh-token',
      expect.objectContaining({
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
        secure: false,
        expires: expect.any(Date),
      }),
    );
    expect(cookieStore.set).toHaveBeenCalledWith(
      'auth_status',
      '1',
      expect.objectContaining({
        httpOnly: false,
        path: '/',
        sameSite: 'lax',
        secure: false,
        expires: expect.any(Date),
      }),
    );
  });

  it('login marks auth cookies secure when the request is HTTPS', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          token: 'access-token',
          refreshToken: 'refresh-token',
          expiresIn: 1800,
          user: {
            id: 1,
            username: 'demo',
            firstName: 'Demo',
            lastName: 'User',
            companyId: 1,
            companyName: 'FarmHUB',
            roles: [],
            roleCodes: [],
            requirePasswordReset: false,
          },
        }),
        {
          status: 200,
          headers: {
            'content-type': 'application/json',
          },
        },
      ),
    );

    const { POST } = await import('../login/route');
    await POST(
      new Request('https://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: 'demo', password: 'Password123!' }),
      }),
    );

    expect(cookieStore.set).toHaveBeenCalledWith(
      'refreshToken',
      'refresh-token',
      expect.objectContaining({
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
        secure: true,
        expires: expect.any(Date),
      }),
    );
  });

  it('refresh reuses the HttpOnly refresh cookie and clears cookies on 401', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          token: 'new-access-token',
          refreshToken: 'new-refresh-token',
          expiresIn: 1800,
          user: {
            id: 1,
            username: 'demo',
            firstName: 'Demo',
            lastName: 'User',
            companyId: 1,
            companyName: 'FarmHUB',
            roles: [],
            roleCodes: [],
            requirePasswordReset: false,
          },
        }),
        {
          status: 200,
          headers: {
            'content-type': 'application/json',
          },
        },
      ),
    );
    resetCookieStore({ refreshToken: 'refresh-token' });

    const { POST: refreshPost } = await import('../refresh/route');
    const refreshResponse = await refreshPost(new Request('http://localhost/api/auth/refresh', { method: 'POST' }));
    const refreshPayload = (await refreshResponse.json()) as Record<string, unknown>;

    expect(refreshPayload.token).toBeUndefined();
    expect(refreshPayload.refreshToken).toBeUndefined();
    expect(cookieStore.set).toHaveBeenCalledWith(
      'accessToken',
      'new-access-token',
      expect.objectContaining({ httpOnly: true }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/Auth/refresh'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ refreshToken: 'refresh-token' }),
      }),
    );

    fetchMock.mockReset();
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ message: 'invalid' }), {
        status: 401,
        headers: {
          'content-type': 'application/json',
        },
      }),
    );
    resetCookieStore({ refreshToken: 'expired-refresh-token' });

    const failedResponse = await refreshPost(new Request('http://localhost/api/auth/refresh', { method: 'POST' }));

    expect(failedResponse.status).toBe(401);
    expect(cookieStore.set).toHaveBeenCalledWith(
      'accessToken',
      '',
      expect.objectContaining({
        httpOnly: true,
        expires: new Date(0),
      }),
    );
    expect(cookieStore.set).toHaveBeenCalledWith(
      'refreshToken',
      '',
      expect.objectContaining({
        httpOnly: true,
        expires: new Date(0),
      }),
    );
    expect(cookieStore.set).toHaveBeenCalledWith(
      'auth_status',
      '',
      expect.objectContaining({
        httpOnly: false,
        expires: new Date(0),
      }),
    );
  });

  it('logout revokes the backend session and clears all auth cookies', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: {
          'content-type': 'application/json',
        },
      }),
    );
    resetCookieStore({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });

    const { POST: logoutPost } = await import('../logout/route');
    const response = await logoutPost(new Request('http://localhost/api/auth/logout', { method: 'POST' }));
    const payload = (await response.json()) as { success?: boolean };

    expect(payload.success).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/Auth/logout'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer access-token',
        }),
        body: JSON.stringify({ refreshToken: 'refresh-token' }),
      }),
    );
    expect(cookieStore.set).toHaveBeenCalledWith(
      'accessToken',
      '',
      expect.objectContaining({ httpOnly: true, expires: new Date(0) }),
    );
    expect(cookieStore.set).toHaveBeenCalledWith(
      'refreshToken',
      '',
      expect.objectContaining({ httpOnly: true, expires: new Date(0) }),
    );
    expect(cookieStore.set).toHaveBeenCalledWith(
      'auth_status',
      '',
      expect.objectContaining({ httpOnly: false, expires: new Date(0) }),
    );
  });
});
