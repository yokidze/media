import fs from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { env } from '../../config/env.js';
import { normalizeStorageRelativePath, resolveStoragePathInsideRoot, resolveStorageRootPath } from './path-safety.js';
export class LocalStorageService {
    root;
    constructor() {
        this.root = resolveStorageRootPath(process.cwd(), env.STORAGE_LOCAL_ROOT);
    }
    async save(input) {
        const safeFolder = normalizeStorageRelativePath(input.folder);
        const fileName = `${randomUUID()}.${input.extension.toLowerCase()}`;
        const targetDir = resolveStoragePathInsideRoot(this.root, safeFolder);
        await fs.mkdir(targetDir, { recursive: true });
        const absolutePath = resolveStoragePathInsideRoot(this.root, `${safeFolder}/${fileName}`);
        await fs.writeFile(absolutePath, input.buffer);
        return {
            fileName,
            relativePath: `${safeFolder}/${fileName}`,
            sizeBytes: input.buffer.length
        };
    }
    async remove(relativePath) {
        const absolute = this.resolveAbsolutePath(relativePath);
        await fs.rm(absolute, { force: true });
    }
    resolveAbsolutePath(relativePath) {
        return resolveStoragePathInsideRoot(this.root, relativePath);
    }
    async getDownloadTarget(relativePath) {
        return {
            type: 'local',
            path: this.resolveAbsolutePath(relativePath)
        };
    }
}
