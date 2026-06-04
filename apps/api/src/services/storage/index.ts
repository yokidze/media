import { env } from '../../config/env.js';
import type { StorageService } from './storage.interface.js';
import { LocalStorageService } from './local-storage.service.js';
import { S3StorageService } from './s3-storage.service.js';

let storageService: StorageService | null = null;

export const getStorageService = (): StorageService => {
  if (storageService) {
    return storageService;
  }

  storageService = env.STORAGE_DRIVER === 'S3' ? new S3StorageService() : new LocalStorageService();
  return storageService;
};
