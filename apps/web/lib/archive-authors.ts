const AUTHOR_MARKERS = ['Преподаватель:', 'Оқытушы:'] as const;

export const extractAuthorNameFromTextContent = (textContent?: string | null): string | null => {
  if (!textContent) return null;

  const lines = textContent
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    const marker = AUTHOR_MARKERS.find((entry) => line.startsWith(entry));
    if (!marker) continue;

    const value = line.slice(marker.length).trim();
    if (value) return value;
  }

  return null;
};
