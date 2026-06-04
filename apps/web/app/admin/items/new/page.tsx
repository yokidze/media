'use client';

import Link from 'next/link';
import { ArchiveItemForm } from '@/components/ArchiveItemForm';
import { useLanguage } from '@/components/LanguageProvider';

export default function NewArchiveItemPage(): React.JSX.Element {
  const { language } = useLanguage();

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-soft md:px-6">
        <Link href="/archive" className="inline-flex items-center text-sm font-medium text-slate-600 transition hover:text-slate-900">
          {language === 'kaz' ? '← Каталогқа оралу' : '← Вернуться в каталог'}
        </Link>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">{language === 'kaz' ? 'Материал қосу' : 'Добавление материала'}</h1>
        <p className="mt-2 text-sm text-slate-600">
          {language === 'kaz'
            ? 'Форманы бір бетте толтырыңыз: түрі мен санатын таңдаңыз, негізгі ақпаратты қосыңыз, файл немесе сілтеме тіркеп, материалды сақтаңыз.'
            : 'Заполните форму на одной странице: выберите тип и категорию, добавьте основную информацию, прикрепите файл или ссылку и сохраните материал.'}
        </p>
      </div>

      <ArchiveItemForm />
    </div>
  );
}
