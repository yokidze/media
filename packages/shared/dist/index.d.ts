export type AccessLevel = 'PUBLIC' | 'STAFF_ONLY' | 'HIDDEN';
export type MaterialType = 'DOCUMENT' | 'ARTICLE' | 'NEWSPAPER' | 'BOOKLET' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'SCAN' | 'OTHER';
export type ContentSection = 'ARTICLE' | 'TV_STORY' | 'EVENT_PHOTO';
export type UserRole = 'GUEST' | 'STAFF' | 'ADMIN';
export interface PaginationMeta {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
}
export interface ApiPaginatedResponse<T> {
    data: T[];
    meta: PaginationMeta;
}
export interface ArchiveFileDto {
    id: string;
    fileName: string;
    originalName: string;
    mimeType: string;
    extension: string;
    sizeBytes: number;
    url: string;
    previewUrl: string | null;
    isPrimary: boolean;
    createdAt: string;
}
export interface ArchiveItemDto {
    id: string;
    slug: string;
    title: string;
    description: string;
    materialType: MaterialType;
    contentSection: ContentSection;
    accessLevel: AccessLevel;
    publicationDate: string | null;
    archiveYear: number | null;
    language: string;
    alphabetLetter: string | null;
    issueNumber: string | null;
    viewsCount: number;
    downloadsCount: number;
    category: {
        id: string;
        name: string;
    } | null;
    author: {
        id: string;
        fullName: string;
    } | null;
    tags: Array<{
        id: string;
        name: string;
    }>;
    files: ArchiveFileDto[];
    createdAt: string;
    updatedAt: string;
}
export interface UserDto {
    id: string;
    email: string;
    fullName: string;
    isActive: boolean;
    roles: UserRole[];
    createdAt: string;
}
