import path from 'node:path';
const WINDOWS_DRIVE_PATTERN = /^[a-zA-Z]:/;
const sanitizePathInput = (value) => value.replaceAll('\\', '/').trim();
export const normalizeStorageRelativePath = (rawPath) => {
    const normalizedInput = sanitizePathInput(rawPath);
    if (!normalizedInput) {
        throw new Error('Storage path is empty');
    }
    if (normalizedInput.includes('\0')) {
        throw new Error('Storage path contains invalid characters');
    }
    if (normalizedInput.startsWith('/') || WINDOWS_DRIVE_PATTERN.test(normalizedInput)) {
        throw new Error('Storage path must be relative');
    }
    const segments = normalizedInput.split('/').filter(Boolean);
    const safeSegments = [];
    for (const segment of segments) {
        if (segment === '.' || segment.length === 0) {
            continue;
        }
        if (segment === '..') {
            throw new Error('Storage path traversal is not allowed');
        }
        safeSegments.push(segment);
    }
    const normalized = safeSegments.join('/');
    if (!normalized) {
        throw new Error('Storage path is empty');
    }
    return normalized;
};
export const ensurePathInsideRoot = (rootAbsolutePath, targetAbsolutePath) => {
    const relative = path.relative(rootAbsolutePath, targetAbsolutePath);
    if (relative === '') {
        return;
    }
    const escapesRoot = relative.startsWith('..') ||
        relative.includes(`${path.sep}..${path.sep}`) ||
        relative.endsWith(`${path.sep}..`) ||
        path.isAbsolute(relative);
    if (escapesRoot) {
        throw new Error('Storage path escapes allowed root');
    }
};
export const resolveStoragePathInsideRoot = (rootAbsolutePath, rawRelativePath) => {
    const normalizedRelative = normalizeStorageRelativePath(rawRelativePath);
    const resolved = path.resolve(rootAbsolutePath, normalizedRelative);
    ensurePathInsideRoot(rootAbsolutePath, resolved);
    return resolved;
};
export const resolveStorageRootPath = (cwdAbsolutePath, configuredStorageRoot) => {
    const root = path.resolve(cwdAbsolutePath, configuredStorageRoot.trim());
    if (!root) {
        throw new Error('Storage root path is empty');
    }
    return root;
};
