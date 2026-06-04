'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useLanguage } from '@/components/LanguageProvider';
import { withClientApiPath } from '@/lib/config';

export function ImportExportPanel(): React.JSX.Element {
  const { language } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string>('');

  const upload = async (): Promise<void> => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    const response = await apiFetch<{ imported: number }>('/admin/import/csv', {
      method: 'POST',
      body: formData,
      headers: {}
    });

    setMessage(language === 'kaz' ? `Жүктелген жазбалар саны: ${response.imported}` : `Импортировано записей: ${response.imported}`);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{language === 'kaz' ? 'Жүктеу және шығару' : 'Импорт и экспорт'}</h1>

      <section className="card space-y-3 p-5">
        <h2 className="text-lg font-semibold">{language === 'kaz' ? 'CSV-ден жүктеу' : 'Импорт из CSV'}</h2>
        <p className="text-sm text-slate-600">
          {language === 'kaz'
            ? 'Қолданылатын бағандар: title, description, category, author, contentSection, materialType, accessLevel, status, language, archiveYear, issueNumber, publicationDate, keywords.'
            : 'Поддерживаемые колонки: title, description, category, author, contentSection, materialType, accessLevel, status, language, archiveYear, issueNumber, publicationDate, keywords.'}
        </p>
        <input type="file" accept=".csv" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
        <button type="button" className="btn btn-primary" onClick={() => void upload()}>
          {language === 'kaz' ? 'Жүктеу' : 'Импортировать'}
        </button>
        {message && <p className="text-sm text-emerald-700">{message}</p>}
      </section>

      <section className="card p-5">
        <h2 className="text-lg font-semibold">{language === 'kaz' ? 'Материалдар тізімін экспорттау' : 'Экспорт списка материалов'}</h2>
        <a className="btn btn-secondary mt-3 inline-block" href={withClientApiPath('/admin/export/archive-items')}>
          {language === 'kaz' ? 'CSV жүктеп алу' : 'Скачать CSV'}
        </a>
      </section>
    </div>
  );
}
