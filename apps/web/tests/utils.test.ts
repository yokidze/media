import { describe, expect, it } from 'vitest';
import { formatBytes, formatDate } from '../lib/utils';

describe('format utilities', () => {
  it('formats bytes for readability', () => {
    expect(formatBytes(1024)).toContain('KB');
    expect(formatBytes(1024 * 1024)).toContain('MB');
  });

  it('formats date to ru locale text', () => {
    expect(formatDate('2025-01-01T00:00:00.000Z')).toMatch(/2025/);
  });
});
