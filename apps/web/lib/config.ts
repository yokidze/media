const normalizeBase = (value: string): string => (value.endsWith('/') ? value.slice(0, -1) : value);
const normalizePath = (value: string): string => (value.startsWith('/') ? value : `/${value}`);

export const clientApiBase = normalizeBase(process.env.NEXT_PUBLIC_CLIENT_API_BASE ?? '/api/v1');
export const serverApiBase = normalizeBase(process.env.INTERNAL_API_BASE ?? 'http://localhost:4000/api/v1');

export const cookieNames = {
  csrf: process.env.NEXT_PUBLIC_CSRF_COOKIE_NAME ?? 'college_csrf',
  access: process.env.NEXT_PUBLIC_ACCESS_TOKEN_COOKIE_NAME ?? 'college_access',
  refresh: process.env.NEXT_PUBLIC_REFRESH_TOKEN_COOKIE_NAME ?? 'college_refresh'
} as const;

export const withClientApiPath = (path: string): string => `${clientApiBase}${normalizePath(path)}`;
export const withServerApiPath = (path: string): string => `${serverApiBase}${normalizePath(path)}`;

export const isServer = typeof window === 'undefined';
