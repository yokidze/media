import path from 'node:path';
import sharp from 'sharp';
import type { StorageService } from './storage/storage.interface.js';

export class PreviewService {
  constructor(private readonly storage: StorageService) {}

  async buildImagePreview(relativePath: string, mimeType: string): Promise<string | null> {
    if (!mimeType.startsWith('image/')) {
      return null;
    }

    const absoluteSource = this.storage.resolveAbsolutePath(relativePath);
    const previewFileName = `${path.basename(relativePath, path.extname(relativePath))}-preview.webp`;
    const previewFolder = path.join(path.dirname(relativePath), 'previews').replaceAll('\\', '/');

    const resized = await sharp(absoluteSource).resize({ width: 640, height: 640, fit: 'inside' }).webp({ quality: 80 }).toBuffer();
    const saved = await this.storage.save({
      buffer: resized,
      folder: previewFolder,
      extension: 'webp',
      mimeType: 'image/webp',
      originalName: previewFileName
    });

    return saved.relativePath;
  }
}
