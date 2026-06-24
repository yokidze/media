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

export const validateUploadMime = (mimeType: string): void => {
  if (!allowedMimeTypes.has(mimeType)) {
    throw badRequest(`Unsupported file type: ${mimeType}`);
  }
};

export const extensionFromName = (filename: string): string => {
  const extension = path.extname(filename).replace('.', '').toLowerCase();
  if (!extension) {
    throw badRequest('File extension is required');
  }

  return extension;
};

const mojibakeMarkers = /[ÃÂÐÑ�]/;
const cyrillicPattern = /[\u0400-\u04FF]/g;

const textScore = (value: string): number => {
  const cyrillicCount = value.match(cyrillicPattern)?.length ?? 0;
  const markerPenalty = value.match(mojibakeMarkers)?.length ?? 0;
  return cyrillicCount - markerPenalty * 2;
};

export const normalizeUploadedFileName = (filename: string): string => {
  const trimmed = filename.trim();
  if (!trimmed) return filename;

  const decoded = Buffer.from(trimmed, 'latin1').toString('utf8');
  return textScore(decoded) > textScore(trimmed) ? decoded : trimmed;
};

export const inferMaterialTypeByMime = (mimeType: string): string => {
  if (mimeType.startsWith('image/')) return 'IMAGE';
  if (mimeType.startsWith('video/')) return 'VIDEO';
  if (mimeType.startsWith('audio/')) return 'AUDIO';
  if (mimeType === 'application/pdf') return 'SCAN';
  return 'DOCUMENT';
};
