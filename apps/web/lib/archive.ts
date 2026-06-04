import type { ContentSection, MaterialType } from './types';

export const SECTION_ORDER: ContentSection[] = ['ARTICLE', 'TV_STORY', 'EVENT_PHOTO'];

export const SECTION_LABELS: Record<ContentSection, string> = {
  ARTICLE: 'Статьи',
  TV_STORY: 'Телесюжеты',
  EVENT_PHOTO: 'Фото мероприятий'
};

export const MATERIAL_TYPE_LABELS: Record<MaterialType, string> = {
  DOCUMENT: 'Документ',
  ARTICLE: 'Статья',
  NEWSPAPER: 'Газета',
  BOOKLET: 'Буклет',
  IMAGE: 'Фото',
  VIDEO: 'Видео',
  AUDIO: 'Аудио',
  SCAN: 'Скан',
  OTHER: 'Другое'
};

export const toSectionFromMaterialType = (materialType: MaterialType): ContentSection => {
  if (materialType === 'VIDEO') return 'TV_STORY';
  if (materialType === 'IMAGE') return 'EVENT_PHOTO';
  return 'ARTICLE';
};

export const isContentSection = (value: string | null | undefined): value is ContentSection =>
  value === 'ARTICLE' || value === 'TV_STORY' || value === 'EVENT_PHOTO';
