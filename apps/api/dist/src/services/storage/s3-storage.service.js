import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';
import { env } from '../../config/env.js';
import { normalizeStorageRelativePath } from './path-safety.js';
export class S3StorageService {
    client;
    constructor() {
        if (!env.S3_ENDPOINT || !env.S3_REGION || !env.S3_BUCKET || !env.S3_ACCESS_KEY_ID || !env.S3_SECRET_ACCESS_KEY) {
            throw new Error('S3 configuration is incomplete');
        }
        this.client = new S3Client({
            endpoint: env.S3_ENDPOINT,
            region: env.S3_REGION,
            credentials: {
                accessKeyId: env.S3_ACCESS_KEY_ID,
                secretAccessKey: env.S3_SECRET_ACCESS_KEY
            },
            forcePathStyle: env.S3_FORCE_PATH_STYLE
        });
    }
    async save(input) {
        const safeFolder = normalizeStorageRelativePath(input.folder);
        const fileName = `${randomUUID()}.${input.extension.toLowerCase()}`;
        const relativePath = normalizeStorageRelativePath(`${safeFolder}/${fileName}`);
        await this.client.send(new PutObjectCommand({
            Bucket: env.S3_BUCKET,
            Key: relativePath,
            Body: input.buffer,
            ContentType: input.mimeType
        }));
        return {
            fileName,
            relativePath,
            sizeBytes: input.buffer.length
        };
    }
    async remove(relativePath) {
        const safeRelativePath = normalizeStorageRelativePath(relativePath);
        await this.client.send(new DeleteObjectCommand({
            Bucket: env.S3_BUCKET,
            Key: safeRelativePath
        }));
    }
    resolveAbsolutePath(relativePath) {
        return normalizeStorageRelativePath(relativePath);
    }
    async getDownloadTarget(relativePath) {
        const safeRelativePath = normalizeStorageRelativePath(relativePath);
        const url = await getSignedUrl(this.client, new GetObjectCommand({
            Bucket: env.S3_BUCKET,
            Key: safeRelativePath
        }), { expiresIn: 300 });
        return {
            type: 'remote',
            url
        };
    }
}
