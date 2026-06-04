import { describe, expect, it } from 'vitest';
import { buildOrderBy, parseArchiveFilters } from '../src/modules/archive-items/archive-items.query.js';

describe('archive filters parser', () => {
  it('parses comma-separated filters', () => {
    const result = parseArchiveFilters({
      section: 'EVENT_PHOTO',
      materialTypes: 'DOCUMENT,IMAGE',
      categoryIds: 'a,b',
      tagIds: 't1,t2,t3',
      hasFile: true
    });

    expect(result.section).toBe('EVENT_PHOTO');
    expect(result.materialTypes).toEqual(['DOCUMENT', 'IMAGE']);
    expect(result.categoryIds).toEqual(['a', 'b']);
    expect(result.tagIds).toEqual(['t1', 't2', 't3']);
    expect(result.hasFile).toBe(true);
  });

  it('builds popularity order', () => {
    expect(buildOrderBy('popularity', 'desc')).toEqual({ viewsCount: 'desc' });
  });
});
