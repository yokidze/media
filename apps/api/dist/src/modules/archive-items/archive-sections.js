import { ContentSection } from '@prisma/client';
export const CONTENT_SECTIONS = [ContentSection.ARTICLE, ContentSection.TV_STORY, ContentSection.EVENT_PHOTO];
export const isContentSection = (value) => value === ContentSection.ARTICLE || value === ContentSection.TV_STORY || value === ContentSection.EVENT_PHOTO;
export const parseContentSection = (value) => {
    if (!value)
        return undefined;
    return isContentSection(value) ? value : undefined;
};
export const deriveContentSection = (materialType) => {
    if (materialType === 'VIDEO')
        return ContentSection.TV_STORY;
    if (materialType === 'IMAGE')
        return ContentSection.EVENT_PHOTO;
    return ContentSection.ARTICLE;
};
export const resolveContentSection = (contentSection, materialType) => {
    if (contentSection)
        return contentSection;
    return deriveContentSection(materialType);
};
