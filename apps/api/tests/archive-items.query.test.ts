import { describe, expect, it } from 'vitest';
import { createArchiveItemSchema } from '../src/modules/archive-items/archive-items.schemas.js';
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

describe('archive item schema', () => {
  const baseBody = {
    title: 'Open lesson',
    materialType: 'DOCUMENT',
    language: 'ru'
  };

  it('allows omitted description when creating an archive item', () => {
    const result = createArchiveItemSchema.safeParse({
      body: baseBody,
      query: {},
      params: {}
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.body.description).toBe('');
    }
  });

  it('allows blank description when creating an archive item', () => {
    const result = createArchiveItemSchema.safeParse({
      body: { ...baseBody, description: '   ' },
      query: {},
      params: {}
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.body.description).toBe('');
    }
  });
});
