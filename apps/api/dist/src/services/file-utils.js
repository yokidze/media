import path from 'node:path';
import { badRequest } from '../common/errors.js';
const allowedMimeTypes = new Set([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'video/mp4',
    'audio/mpeg',
    'text/plain',
    'application/zip'
]);
export const validateUploadMime = (mimeType) => {
    if (!allowedMimeTypes.has(mimeType)) {
        throw badRequest(`Unsupported file type: ${mimeType}`);
    }
};
export const extensionFromName = (filename) => {
    const extension = path.extname(filename).replace('.', '').toLowerCase();
    if (!extension) {
        throw badRequest('File extension is required');
    }
    return extension;
};
export const inferMaterialTypeByMime = (mimeType) => {
    if (mimeType.startsWith('image/'))
        return 'IMAGE';
    if (mimeType.startsWith('video/'))
        return 'VIDEO';
    if (mimeType.startsWith('audio/'))
        return 'AUDIO';
    if (mimeType === 'application/pdf')
        return 'SCAN';
    return 'DOCUMENT';
};
