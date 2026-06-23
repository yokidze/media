import type { ContentSection, MaterialType } from './types';

export const SECTION_ORDER: ContentSection[] = ['ARTICLE', 'TV_STORY', 'EVENT_PHOTO', 'METHODICAL_AUTHOR_PROGRAM'];

export const SECTION_LABELS: Record<ContentSection, string> = {
  ARTICLE: 'Статьи',
  TV_STORY: 'Телесюжеты',
  EVENT_PHOTO: 'Фото мероприятий',
  METHODICAL_AUTHOR_PROGRAM: 'Методические рекомендации и авторские программы'
};

export const MATERIAL_TYPE_LABELS: Record<MaterialType, string> = {
  DOCUMENT: 'Документ',
  ARTICLE: 'Статья',
  NEWSPAPER: 'Газета',
  BOOKLET: 'Буклет',
  UMKD: 'Учебно-методический комплекс дисциплины',
  METHODICAL_RECOMMENDATION_PROGRAM: 'Методические рекомендации и авторские программы',
  IMAGE: 'Фото',
  VIDEO: 'Видео',
  AUDIO: 'Аудио',
  SCAN: 'Скан',
  OTHER: 'Другое'
};

export const toSectionFromMaterialType = (materialType: MaterialType): ContentSection => {
  if (materialType === 'VIDEO') return 'TV_STORY';
  if (materialType === 'IMAGE') return 'EVENT_PHOTO';
  if (materialType === 'UMKD' || materialType === 'METHODICAL_RECOMMENDATION_PROGRAM') return 'METHODICAL_AUTHOR_PROGRAM';
  return 'ARTICLE';
};

export const isContentSection = (value: string | null | undefined): value is ContentSection =>
  value === 'ARTICLE' || value === 'TV_STORY' || value === 'EVENT_PHOTO' || value === 'METHODICAL_AUTHOR_PROGRAM';
