'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/components/LanguageProvider';

const adminLinks = (language: 'rus' | 'kaz') =>
  [
    { href: '/admin', label: language === 'kaz' ? 'Шолу' : 'Обзор' },
    { href: '/admin/users', label: language === 'kaz' ? 'Пайдаланушылар' : 'Пользователи' },
    { href: '/admin/items', label: language === 'kaz' ? 'Материалдар' : 'Материалы' },
    { href: '/admin/categories', label: language === 'kaz' ? 'Санаттар' : 'Категории' },
    { href: '/admin/access', label: language === 'kaz' ? 'Рөлдер мен қолжетімділік' : 'Роли и доступы' },
    { href: '/admin/logs', label: language === 'kaz' ? 'Әрекет журналы' : 'Журнал действий' },
    { href: '/admin/import', label: language === 'kaz' ? 'Жүктеу / шығару' : 'Импорт / экспорт' }
  ] as const;

const isActiveLink = (pathname: string, href: string): boolean => {
  if (href === '/admin') return pathname === href;
  return pathname.startsWith(href);
};

export function AdminSidebar(): React.JSX.Element {
  const pathname = usePathname();
  const { language } = useLanguage();

  return (
    <aside className="card h-fit p-4">
      <p className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{language === 'kaz' ? 'Әкімші панелі' : 'Панель администратора'}</p>
      <nav className="space-y-1">
        {adminLinks(language).map((link) => {
          const active = isActiveLink(pathname, link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`block rounded-md px-3 py-2 text-sm font-medium transition ${
                active ? 'bg-brand-700 text-white' : 'text-slate-700 hover:bg-brand-50 hover:text-brand-700'
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
