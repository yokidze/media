export type AccessLevel = 'PUBLIC' | 'STAFF_ONLY' | 'HIDDEN';
export type MaterialType = 'DOCUMENT' | 'ARTICLE' | 'NEWSPAPER' | 'BOOKLET' | 'UMKD' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'SCAN' | 'OTHER';
export type ContentSection = 'ARTICLE' | 'TV_STORY' | 'EVENT_PHOTO' | 'METHODICAL_AUTHOR_PROGRAM';

export interface Category {
  id: string;
  name: string;
  nameRu?: string | null;
  nameKaz?: string | null;
  slug: string;
  description?: string | null;
  parentId?: string | null;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export interface ArchiveFile {
  id: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  extension: string;
  sizeBytes: number;
  previewPath?: string | null;
  isPrimary: boolean;
}

export interface ArchiveItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  materialType: MaterialType;
  contentSection: ContentSection;
  accessLevel: AccessLevel;
  status: 'DRAFT' | 'PUBLISHED';
  publicationDate: string | null;
  archiveYear: number | null;
  issueNumber: string | null;
  textContent?: string | null;
  language: string;
  keywords: string[];
  viewsCount: number;
  downloadsCount: number;
  category?: Category | null;
  author?: { id: string; fullName: string } | null;
  tags: Tag[];
  files: ArchiveFile[];
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface SearchAutocompleteItem {
  id: string;
  slug: string;
  title: string;
  contentSection: ContentSection;
  materialType: MaterialType;
  publicationDate: string | null;
  archiveYear: number | null;
}
