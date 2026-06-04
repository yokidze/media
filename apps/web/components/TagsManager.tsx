'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useLanguage } from '@/components/LanguageProvider';

interface Tag {
  id: string;
  name: string;
  slug: string;
}

export function TagsManager(): React.JSX.Element {
  const { language } = useLanguage();
  const [tags, setTags] = useState<Tag[]>([]);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = async (): Promise<void> => {
    const response = await apiFetch<{ data: Tag[] }>('/tags?page=1&pageSize=200');
    setTags(response.data);
  };

  useEffect(() => {
    load().catch(() => setError(language === 'kaz' ? 'Тегтерді жүктеу мүмкін болмады' : 'Не удалось загрузить теги'));
  }, [language]);

  const createTag = async (): Promise<void> => {
    if (name.trim().length < 2) {
      setError(language === 'kaz' ? 'Тег атауын енгізіңіз (кемінде 2 таңба).' : 'Введите название тега (минимум 2 символа).');
      return;
    }

    await apiFetch('/tags', {
      method: 'POST',
      body: JSON.stringify({ name: name.trim() })
    });

    setName('');
    setError(null);
    await load();
  };

  const removeTag = async (id: string): Promise<void> => {
    await apiFetch(`/tags/${id}`, { method: 'DELETE' });
    await load();
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">{language === 'kaz' ? 'Тегтер' : 'Теги'}</h1>

      <div className="card flex gap-3 p-4">
        <input className="input" placeholder={language === 'kaz' ? 'Тег атауы' : 'Название тега'} value={name} onChange={(event) => setName(event.target.value)} />
        <button type="button" className="btn btn-primary" onClick={() => void createTag()}>
          {language === 'kaz' ? 'Қосу' : 'Добавить'}
        </button>
      </div>

      {error && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-3 py-2">{language === 'kaz' ? 'Атауы' : 'Название'}</th>
              <th className="px-3 py-2">Slug</th>
              <th className="px-3 py-2">{language === 'kaz' ? 'Әрекеттер' : 'Действия'}</th>
            </tr>
          </thead>
          <tbody>
            {tags.map((tag) => (
              <tr key={tag.id} className="border-t border-slate-100">
                <td className="px-3 py-2">{tag.name}</td>
                <td className="px-3 py-2 text-slate-500">{tag.slug}</td>
                <td className="px-3 py-2">
                  <button type="button" className="text-red-700" onClick={() => void removeTag(tag.id)}>
                    {language === 'kaz' ? 'Жою' : 'Удалить'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
