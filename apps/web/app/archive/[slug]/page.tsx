'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { notFound, useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { formatDate, formatBytes } from '@/lib/utils';
import type { ContentSection, MaterialType } from '@/lib/types';
import { useLanguage } from '@/components/LanguageProvider';
import { withClientApiPath } from '@/lib/config';

interface ArchiveItemDetail {
  id: string;
  slug: string;
  title: string;
  description: string;
  materialType: MaterialType;
  contentSection: ContentSection;
  accessLevel: string;
  status: 'DRAFT' | 'PUBLISHED';
  publicationDate: string | null;
  archiveYear: number | null;
  academicYear: string | null;
  issueNumber: string | null;
  textContent?: string | null;
  language: string;
  keywords: string[];
  viewsCount: number;
  downloadsCount: number;
  category?: { id: string; name: string; nameRu?: string | null; nameKaz?: string | null } | null;
  author?: { id: string; fullName: string } | null;
  tags: Array<{ id: string; name: string }>;
  files: Array<{
    id: string;
    originalName: string;
    mimeType: string;
    extension: string;
    sizeBytes: number;
    isPrimary: boolean;
    previewPath?: string | null;
  }>;
  recommendations: Array<{
    id: string;
    slug: string;
    title: string;
    category?: { name: string; nameRu?: string | null; nameKaz?: string | null } | null;
  }>;
}

const EXTERNAL_LINK_MARKERS = ['Внешняя ссылка:', 'Сыртқы сілтеме:'] as const;

const parseExternalUrlFromTextContent = (textContent: string | null | undefined): string | null => {
  if (!textContent) return null;

  const lines = textContent
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    const marker = EXTERNAL_LINK_MARKERS.find((entry) => line.startsWith(entry));
    if (!marker) continue;

    const maybeUrl = line.slice(marker.length).trim();
    if (/^https?:\/\//i.test(maybeUrl)) {
      return maybeUrl;
    }
  }

  const fallbackMatch = textContent.match(/https?:\/\/[^\s)]+/i);
  return fallbackMatch ? fallbackMatch[0] : null;
};

const toYouTubeEmbedUrl = (url: string): string | null => {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '').toLowerCase();

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      const id = parsed.searchParams.get('v');
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    if (host === 'youtu.be') {
      const id = parsed.pathname.replace('/', '').trim();
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
  } catch {
    return null;
  }

  return null;
};

const renderPreview = (file: ArchiveItemDetail['files'][number], noPreviewText: string): React.JSX.Element => {
  if (file.mimeType === 'application/pdf') {
    return <iframe title={file.originalName} src={withClientApiPath(`/files/${file.id}/view`)} className="h-[540px] w-full rounded-lg border border-slate-200" />;
  }

  if (file.mimeType.startsWith('image/')) {
    return <img src={withClientApiPath(`/files/${file.id}/view`)} alt={file.originalName} className="max-h-[540px] w-full rounded-lg object-contain" />;
  }

  if (file.mimeType.startsWith('video/')) {
    return <video src={withClientApiPath(`/files/${file.id}/view`)} controls className="max-h-[540px] w-full rounded-lg" />;
  }

  if (file.mimeType.startsWith('audio/')) {
    return <audio src={withClientApiPath(`/files/${file.id}/view`)} controls className="w-full" />;
  }

  return <p className="text-sm text-slate-600">{noPreviewText}</p>;
};

export default function ArchiveItemDetailPage(): React.JSX.Element {
  const params = useParams<{ slug: string }>();
  const { categoryLabel, language, materialTypeLabel, sectionLabel } = useLanguage();
  const [item, setItem] = useState<ArchiveItemDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const slug = params?.slug;
    if (!slug) return;

    setIsLoading(true);
    apiFetch<ArchiveItemDetail>(`/archive-items/${slug}`)
      .then((data) => setItem(data))
      .catch(() => setItem(null))
      .finally(() => setIsLoading(false));
  }, [params?.slug]);

  if (!isLoading && !item) {
    notFound();
  }

  if (!item) {
    return <div className="container-shell py-10 text-slate-500">{language === 'kaz' ? 'Жүктелуде...' : 'Загрузка...'}</div>;
  }

  const primaryFile = item.files.find((file) => file.isPrimary) ?? item.files[0];
  const externalUrl = parseExternalUrlFromTextContent(item.textContent);
  const youtubeEmbedUrl = externalUrl ? toYouTubeEmbedUrl(externalUrl) : null;

  return (
    <div className="container-shell py-10">
      <nav className="mb-4 text-sm text-slate-500">
        <Link href="/">{language === 'kaz' ? 'Басты бет' : 'Главная'}</Link> / <Link href="/archive">{language === 'kaz' ? 'Мұрағат' : 'Каталог'}</Link> / <span>{item.title}</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="card p-6">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700">{sectionLabel(item.contentSection)}</span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">{materialTypeLabel(item.materialType)}</span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">{item.accessLevel}</span>
          </div>

          <h1 className="font-[var(--font-merriweather)] text-3xl font-bold leading-tight">{item.title}</h1>
          <p className="mt-4 text-slate-700">{item.description}</p>

          <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-slate-500">{language === 'kaz' ? 'Автор' : 'Автор'}</dt>
              <dd className="font-medium text-slate-800">{item.author?.fullName ?? (language === 'kaz' ? 'Көрсетілмеген' : 'Не указан')}</dd>
            </div>
            <div>
              <dt className="text-slate-500">{language === 'kaz' ? 'Санат' : 'Категория'}</dt>
              <dd className="font-medium text-slate-800">{item.category ? categoryLabel(item.category) : language === 'kaz' ? 'Көрсетілмеген' : 'Не указана'}</dd>
            </div>
            <div>
              <dt className="text-slate-500">{language === 'kaz' ? 'Жарияланған күні' : 'Дата публикации'}</dt>
              <dd className="font-medium text-slate-800">{formatDate(item.publicationDate)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">{language === 'kaz' ? 'Жыл' : 'Год'}</dt>
              <dd className="font-medium text-slate-800">{item.archiveYear ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-slate-500">{language === 'kaz' ? 'Шығарылым' : 'Выпуск'}</dt>
              <dd className="font-medium text-slate-800">{item.issueNumber ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-slate-500">{language === 'kaz' ? 'Тіл' : 'Язык'}</dt>
              <dd className="font-medium text-slate-800">{item.language}</dd>
            </div>
            <div>
              <dt className="text-slate-500">{language === 'kaz' ? 'Қаралымдар' : 'Просмотры'}</dt>
              <dd className="font-medium text-slate-800">{item.viewsCount}</dd>
            </div>
            <div>
              <dt className="text-slate-500">{language === 'kaz' ? 'Жүктеп алулар' : 'Скачивания'}</dt>
              <dd className="font-medium text-slate-800">{item.downloadsCount}</dd>
            </div>
          </dl>

          <div className="mt-6 flex flex-wrap gap-2">
            {item.tags.map((tag) => (
              <Link key={tag.id} href={`/archive?tagIds=${tag.id}`} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                #{tag.name}
              </Link>
            ))}
          </div>
        </article>

        <aside className="space-y-4">
          <section className="card p-4">
            <h2 className="text-lg font-semibold">{language === 'kaz' ? 'Алдын ала қарау' : 'Предпросмотр'}</h2>
            <div className="mt-3">
              {primaryFile
                ? renderPreview(primaryFile, language === 'kaz' ? 'Бұл формат үшін алдын ала қарау қолжетімсіз.' : 'Предпросмотр для данного формата недоступен.')
                : youtubeEmbedUrl
                  ? (
                    <iframe
                      title={item.title}
                      src={youtubeEmbedUrl}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allowFullScreen
                      className="h-[360px] w-full rounded-lg border border-slate-200"
                    />
                  )
                  : externalUrl
                    ? (
                      <a
                        href={externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-brand-700 underline decoration-dotted underline-offset-4 hover:text-brand-800"
                      >
                        {language === 'kaz' ? 'Сыртқы сілтемені ашу' : 'Открыть внешнюю ссылку'}
                      </a>
                    )
                    : <p className="text-sm text-slate-500">{language === 'kaz' ? 'Алдын ала қарауға файл жоқ.' : 'Нет файла для предпросмотра.'}</p>}
            </div>
          </section>

          {externalUrl && (
            <section className="card p-4">
              <h2 className="text-lg font-semibold">{language === 'kaz' ? 'Сыртқы сілтеме' : 'Внешняя ссылка'}</h2>
              <a
                href={externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 block break-all text-sm text-brand-700 underline decoration-dotted underline-offset-4 hover:text-brand-800"
              >
                {externalUrl}
              </a>
            </section>
          )}

          <section className="card p-4">
            <h2 className="text-lg font-semibold">{language === 'kaz' ? 'Файлдар' : 'Файлы'}</h2>
            <ul className="mt-3 space-y-2">
              {item.files.map((file) => (
                <li key={file.id} className="rounded-lg border border-slate-200 p-3">
                  <p className="text-sm font-medium text-slate-800">{file.originalName}</p>
                  <p className="mt-1 text-xs text-slate-500">{file.extension.toUpperCase()} · {formatBytes(file.sizeBytes)}</p>
                  <div className="mt-2 flex gap-3 text-sm">
                    <Link href={withClientApiPath(`/files/${file.id}/view`)} className="text-brand-700 hover:text-brand-800">
                      {language === 'kaz' ? 'Ашу' : 'Открыть'}
                    </Link>
                    <Link href={withClientApiPath(`/files/${file.id}/download`)} className="text-brand-700 hover:text-brand-800">
                      {language === 'kaz' ? 'Жүктеп алу' : 'Скачать'}
                    </Link>
                  </div>
                </li>
              ))}
              {item.files.length === 0 && (
                <li className="text-sm text-slate-500">
                  {language === 'kaz' ? 'Файл тіркелмеген.' : 'Файлы не прикреплены.'}
                </li>
              )}
            </ul>
          </section>
        </aside>
      </div>

      {item.recommendations.length > 0 && (
        <section className="mt-8 card p-5">
          <h2 className="text-xl font-semibold">{language === 'kaz' ? 'Ұқсас материалдар' : 'Похожие материалы'}</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {item.recommendations.map((recommendation) => (
              <Link key={recommendation.id} href={`/archive/${recommendation.slug}`} className="rounded-lg border border-slate-200 p-3 hover:border-brand-300">
                <p className="font-semibold">{recommendation.title}</p>
                <p className="text-sm text-slate-500">{recommendation.category ? categoryLabel(recommendation.category) : language === 'kaz' ? 'Санатсыз' : 'Без категории'}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
