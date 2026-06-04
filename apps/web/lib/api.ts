import { cookieNames, isServer, withClientApiPath, withServerApiPath } from './config';

type FetchOptions = RequestInit & {
  authRequired?: boolean;
};

const resolveApiPath = (path: string): string => (isServer ? withServerApiPath(path) : withClientApiPath(path));

let refreshInFlight: Promise<boolean> | null = null;

const readCsrfToken = (): string | undefined => {
  if (isServer) return undefined;
  const cookie = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(`${cookieNames.csrf}=`));

  return cookie ? decodeURIComponent(cookie.split('=')[1]) : undefined;
};

const tryRefreshSession = async (): Promise<boolean> => {
  if (isServer) return false;

  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const response = await fetch(withClientApiPath('/auth/refresh'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: '{}',
          credentials: 'include',
          cache: 'no-store'
        });

        return response.ok;
      } catch {
        return false;
      } finally {
        refreshInFlight = null;
      }
    })();
  }

  return refreshInFlight;
};

export async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const method = options.method?.toUpperCase() ?? 'GET';

  const buildHeaders = (): Headers => {
    const headers = new Headers(options.headers ?? {});

    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      const csrf = readCsrfToken();
      if (csrf) {
        headers.set('x-csrf-token', csrf);
      }
    }

    return headers;
  };

  const doRequest = async (): Promise<Response> =>
    fetch(resolveApiPath(path), {
      ...options,
      headers: buildHeaders(),
      credentials: 'include',
      cache: 'no-store'
    });

  let response = await doRequest();

  const shouldTryRefresh =
    response.status === 401 &&
    !isServer &&
    !path.startsWith('/auth/login') &&
    !path.startsWith('/auth/refresh') &&
    !path.startsWith('/auth/logout');

  if (shouldTryRefresh) {
    const refreshed = await tryRefreshSession();
    if (refreshed) {
      response = await doRequest();
    }
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(payload.error ?? 'Request failed');
  }

  if (response.status === 204) {
    return null as T;
  }

  return (await response.json()) as T;
}
