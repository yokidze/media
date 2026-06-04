'use client';

import Link from 'next/link';
import { useLanguage } from '@/components/LanguageProvider';
import { useManageAccess } from '@/components/useManageAccess';

interface AddMaterialButtonProps {
  className?: string;
  variant?: 'primary' | 'subtle';
  canCreate?: boolean;
}

export function AddMaterialButton({ className, variant = 'primary', canCreate: canCreateProp }: AddMaterialButtonProps): React.JSX.Element {
  const { t } = useLanguage();
  const canManage = useManageAccess();
  const canCreate = typeof canCreateProp === 'boolean' ? canCreateProp : canManage;

  if (!canCreate) {
    return <></>;
  }

  const variantClassName =
    variant === 'subtle'
      ? 'text-sm font-semibold text-slate-700/70 hover:text-slate-900 hover:underline'
      : 'rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-800';

  return (
    <Link
      href="/admin/items/new"
      className={`inline-flex items-center gap-1.5 transition ${variantClassName} ${className ?? ''}`}
    >
      <span aria-hidden="true" className="text-base leading-none">
        +
      </span>
      <span>{t('addMaterialButton')}</span>
    </Link>
  );
}