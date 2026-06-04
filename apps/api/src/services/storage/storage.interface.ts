export interface SaveFileInput {
  buffer: Buffer;
  folder: string;
  extension: string;
  mimeType: string;
  originalName: string;
}

export interface SavedFile {
  fileName: string;
  relativePath: string;
  sizeBytes: number;
}

export type DownloadTarget = { type: 'local'; path: string } | { type: 'remote'; url: string };

export interface StorageService {
  save(input: SaveFileInput): Promise<SavedFile>;
  remove(relativePath: string): Promise<void>;
  resolveAbsolutePath(relativePath: string): string;
  getDownloadTarget(relativePath: string): Promise<DownloadTarget>;
}
