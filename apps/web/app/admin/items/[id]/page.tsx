'use client';

import { use } from 'react';
import { ArchiveItemForm } from '@/components/ArchiveItemForm';
import { useLanguage } from '@/components/LanguageProvider';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditArchiveItemPage({ params }: PageProps): React.JSX.Element {
  const { language } = useLanguage();
  const { id } = use(params);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">{language === 'kaz' ? 'Материалды өңдеу' : 'Редактирование материала'}</h1>
      <ArchiveItemForm itemId={id} />
    </div>
  );
}
