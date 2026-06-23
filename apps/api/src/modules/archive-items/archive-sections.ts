import { ContentSection, MaterialType } from '@prisma/client';

export const CONTENT_SECTIONS = [
  ContentSection.ARTICLE,
  ContentSection.TV_STORY,
  ContentSection.EVENT_PHOTO,
  ContentSection.METHODICAL_AUTHOR_PROGRAM
] as const;

export const isContentSection = (value: string): value is ContentSection =>
  value === ContentSection.ARTICLE ||
  value === ContentSection.TV_STORY ||
  value === ContentSection.EVENT_PHOTO ||
  value === ContentSection.METHODICAL_AUTHOR_PROGRAM;

export const parseContentSection = (value: string | null | undefined): ContentSection | undefined => {
  if (!value) return undefined;
  return isContentSection(value) ? value : undefined;
};

export const deriveContentSection = (materialType: MaterialType): ContentSection => {
  if (materialType === 'VIDEO') return ContentSection.TV_STORY;
  if (materialType === 'IMAGE') return ContentSection.EVENT_PHOTO;
  if (materialType === 'UMKD' || materialType === 'METHODICAL_RECOMMENDATION_PROGRAM') return ContentSection.METHODICAL_AUTHOR_PROGRAM;
  return ContentSection.ARTICLE;
};

export const resolveContentSection = (contentSection: ContentSection | null | undefined, materialType: MaterialType): ContentSection => {
  if (contentSection) return contentSection;
  return deriveContentSection(materialType);
};
