'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useLanguage } from '@/components/LanguageProvider';

interface Category {
  id: string;
  name: string;
  nameRu?: string | null;
  nameKaz?: string | null;
  description?: string | null;
  children: Category[];
}

export default function CategoriesPage(): React.JSX.Element {
  const { categoryLabel, language } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    apiFetch<Category[]>('/categories')
      .then((data) => setCategories(data))
      .catch(() => setCategories([]));
  }, []);

  return (
    <div className="container-shell py-10">
      <h1 className="text-3xl font-bold">{language === 'kaz' ? 'Архив санаттары' : 'Категории архива'}</h1>
      <p className="mt-2 text-sm text-slate-600">
        {language === 'kaz' ? 'Материал санаттары мен ішкі санаттар бойынша навигация.' : 'Навигация по категориям и подкатегориям материалов.'}
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {categories.map((category) => (
          <article key={category.id} className="card p-5">
            <h2 className="text-lg font-semibold">{categoryLabel(category)}</h2>
            <p className="mt-2 text-sm text-slate-600">{category.description ?? (language === 'kaz' ? 'Сипаттама жоқ' : 'Без описания')}</p>
            <Link href={`/archive?categoryIds=${category.id}`} className="mt-4 inline-block text-sm font-semibold text-brand-700 hover:text-brand-800">
              {language === 'kaz' ? 'Материалдарды ашу' : 'Открыть материалы'}
            </Link>

            {category.children.length > 0 && (
              <div className="mt-4 border-t border-slate-100 pt-3">
                <p className="text-xs uppercase tracking-[0.08em] text-slate-500">{language === 'kaz' ? 'Ішкі санаттар' : 'Подкатегории'}</p>
                <ul className="mt-2 space-y-1 text-sm">
                  {category.children.map((child) => (
                    <li key={child.id}>
                      <Link href={`/archive?categoryIds=${child.id}`} className="text-slate-700 hover:text-brand-700">
                        {child.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
