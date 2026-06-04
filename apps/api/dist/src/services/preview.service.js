import path from 'node:path';
import sharp from 'sharp';
export class PreviewService {
    storage;
    constructor(storage) {
        this.storage = storage;
    }
    async buildImagePreview(relativePath, mimeType) {
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
