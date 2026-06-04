import { withServerApiPath } from './config';

export async function serverGet<T>(path: string): Promise<T> {
  const response = await fetch(withServerApiPath(path), {
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error(`Server request failed: ${path}`);
  }

  return (await response.json()) as T;
}
