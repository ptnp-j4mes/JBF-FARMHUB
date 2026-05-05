import { beforeEach, describe, expect, it, vi } from 'vitest';

const { apiPostMock, cookiesRemoveMock, cookiesGetMock } = vi.hoisted(() => ({
  apiPostMock: vi.fn(),
  cookiesRemoveMock: vi.fn(),
  cookiesGetMock: vi.fn(),
}));

vi.mock('@/lib/api/client', () => ({
  apiClient: {
    post: apiPostMock,
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
  },
}));

vi.mock('js-cookie', () => ({
  default: {
    get: cookiesGetMock,
    remove: cookiesRemoveMock,
  },
}));

vi.mock('@/lib/facility-context', () => ({
  ensureCurrentFacilityForUser: vi.fn(),
  setCurrentFacilityContext: vi.fn(),
}));

vi.mock('../access-context.service', () => ({
  invalidateAccessBootstrapCache: vi.fn(),
}));

type StorageMap = Record<string, string>;

function createStorage(initial: StorageMap = {}) {
  const store = new Map<string, string>(Object.entries(initial));
  return {
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      store.delete(key);
    }),
    clear: vi.fn(() => {
      store.clear();
    }),
    dump: () => Object.fromEntries(store.entries()),
  };
}

function installBrowserGlobals(storage: ReturnType<typeof createStorage>) {
  const document = { cookie: '' };
  const CustomEventMock = class CustomEventMock {
    type: string;
    detail: unknown;

    constructor(type: string, init?: { detail?: unknown }) {
      this.type = type;
      this.detail = init?.detail;
    }
  };
  vi.stubGlobal('localStorage', storage);
  vi.stubGlobal('window', {
    localStorage: storage,
    document,
    location: {
      href: 'http://localhost/',
      protocol: 'http:',
    },
    dispatchEvent: vi.fn(),
  } as any);
  vi.stubGlobal('document', document as any);
  vi.stubGlobal('CustomEvent', CustomEventMock as any);
}

describe('authService', () => {
  beforeEach(() => {
    apiPostMock.mockReset();
    cookiesRemoveMock.mockReset();
    cookiesGetMock.mockReset();
    cookiesGetMock.mockReturnValue(null);
    const storage = createStorage();
    installBrowserGlobals(storage);
  });

  it('login stores the user snapshot without writing a legacy access token', async () => {
    const storage = globalThis.localStorage as ReturnType<typeof createStorage>;
    apiPostMock.mockResolvedValue({
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
      expiresIn: 1800,
    });

    const { authService } = await import('../auth.service');
    const response = await authService.login({
      username: 'demo',
      password: 'Password123!',
    });

    expect(response.user.username).toBe('demo');
    expect(storage.getItem('user_info')).not.toBeNull();
    expect(storage.getItem('access_token')).toBeNull();
    expect(storage.getItem('refresh_token')).toBeNull();
    expect(cookiesRemoveMock).not.toHaveBeenCalled();
  });

  it('logout clears local auth state and legacy token storage', async () => {
    const storage = createStorage({
      user_info: JSON.stringify({ id: 1 }),
      access_token: 'legacy-access-token',
      refresh_token: 'legacy-refresh-token',
    });
    installBrowserGlobals(storage);
    apiPostMock.mockResolvedValue({ success: true });

    const { authService } = await import('../auth.service');
    authService.logout();

    expect(apiPostMock).toHaveBeenCalledWith(
      '/api/auth/logout',
      {},
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      }),
    );
    expect(storage.getItem('user_info')).toBeNull();
    expect(storage.getItem('access_token')).toBeNull();
    expect(storage.getItem('refresh_token')).toBeNull();
    expect(cookiesRemoveMock).toHaveBeenCalledWith('auth_status', { path: '/' });
    expect(cookiesRemoveMock).not.toHaveBeenCalledWith('refreshToken');
  });
});
