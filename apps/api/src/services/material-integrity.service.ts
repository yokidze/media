import fs from 'node:fs/promises';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import { getStorageService } from './storage/index.js';

const EXTERNAL_LINK_PATTERNS = [
  /Внешняя ссылка:\s*https?:\/\/\S+/i,
  /Сыртқы сілтеме:\s*https?:\/\/\S+/i
];

const storage = getStorageService();

export interface MaterialIntegrityFileRecord {
  relativePath: string;
}

export interface MaterialIntegrityRecord {
  id: string;
  status?: 'PUBLISHED' | 'DRAFT';
  textContent?: string | null;
  files?: MaterialIntegrityFileRecord[];
}

const hasExternalLink = (textContent: string | null | undefined): boolean =>
  typeof textContent === 'string' && EXTERNAL_LINK_PATTERNS.some((pattern) => pattern.test(textContent));

const hasAvailableLocalFile = async (relativePath: string): Promise<boolean> => {
  try {
    const absolutePath = storage.resolveAbsolutePath(relativePath);
    await fs.access(absolutePath);
    return true;
  } catch {
    return false;
  }
};

export async function getMaterialValidityMap<T extends MaterialIntegrityRecord>(
  items: T[]
): Promise<Map<string, { hasLink: boolean; availableFilesCount: number; isValid: boolean }>> {
  const fileAvailabilityCache = new Map<string, boolean>();

  const entries = await Promise.all(
    items.map(async (item) => {
      const hasLink = hasExternalLink(item.textContent);
      let availableFilesCount = 0;

      if ((item.files?.length ?? 0) > 0) {
        if (env.STORAGE_DRIVER === 'LOCAL') {
          const availability = await Promise.all(
            (item.files ?? []).map(async (file) => {
              const cached = fileAvailabilityCache.get(file.relativePath);
              if (cached !== undefined) {
                return cached;
              }

              const exists = await hasAvailableLocalFile(file.relativePath);
              fileAvailabilityCache.set(file.relativePath, exists);
              return exists;
            })
          );

          availableFilesCount = availability.filter(Boolean).length;
        } else {
          availableFilesCount = item.files?.length ?? 0;
        }
      }

      return [
        item.id,
        {
          hasLink,
          availableFilesCount,
          isValid: hasLink || availableFilesCount > 0
        }
      ] as const;
    })
  );

  return new Map(entries);
}

export async function filterValidMaterials<T extends MaterialIntegrityRecord>(items: T[]): Promise<T[]> {
  const validityMap = await getMaterialValidityMap(items);
  return items.filter((item) => validityMap.get(item.id)?.isValid);
}

export async function getMaterialIntegritySummary(): Promise<{
  totalMaterials: number;
  publishedMaterials: number;
  draftMaterials: number;
  totalFiles: number;
}> {
  const items = await prisma.archiveItem.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      status: true,
      textContent: true,
      files: {
        select: {
          id: true,
          relativePath: true
        }
      }
    }
  });

  const validityMap = await getMaterialValidityMap(items);

  let totalMaterials = 0;
  let publishedMaterials = 0;
  let draftMaterials = 0;
  let totalFiles = 0;

  for (const item of items) {
    const integrity = validityMap.get(item.id);
    if (!integrity?.isValid) {
      continue;
    }

    totalMaterials += 1;
    totalFiles += integrity.availableFilesCount;

    if (item.status === 'PUBLISHED') {
      publishedMaterials += 1;
    } else {
      draftMaterials += 1;
    }
  }

  return {
    totalMaterials,
    publishedMaterials,
    draftMaterials,
    totalFiles
  };
}
