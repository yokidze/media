'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { useLanguage } from '@/components/LanguageProvider';

interface MeResponse {
  roles?: string[];
}

type GateState = 'loading' | 'allowed' | 'forbidden';

const isStaffMaterialRoute = (pathname: string): boolean =>
  pathname === '/admin/items/new' || /^\/admin\/items\/[0-9a-f-]+$/i.test(pathname);

const hasRole = (roles: string[] | undefined, required: Array<'ADMIN' | 'STAFF'>): boolean => {
  const source = Array.isArray(roles) ? roles : [];
  return required.some((role) => source.includes(role));
};

export function AdminAccessGate({ children }: { children: React.ReactNode }): React.JSX.Element {
  const pathname = usePathname();
  const router = useRouter();
  const { language } = useLanguage();
  const [state, setState] = useState<GateState>('loading');

  const requiredRoles = useMemo<Array<'ADMIN' | 'STAFF'>>(() => {
    if (isStaffMaterialRoute(pathname)) return ['ADMIN', 'STAFF'];
    return ['ADMIN'];
  }, [pathname]);

  useEffect(() => {
    let active = true;

    const load = async (): Promise<void> => {
      try {
        const me = await apiFetch<MeResponse>('/auth/me');
        if (!active) return;
        if (hasRole(me.roles, requiredRoles)) {
          setState('allowed');
        } else {
          setState('forbidden');
        }
      } catch {
        if (!active) return;
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      }
    };

    setState('loading');
    void load();

    return () => {
      active = false;
    };
  }, [pathname, requiredRoles, router]);

  if (state === 'loading') {
    return <div className="card p-6 text-sm text-slate-500">{language === 'kaz' ? 'Қолжетімділік құқықтарын тексеріп жатырмыз...' : 'Проверяем права доступа...'}</div>;
  }

  if (state === 'forbidden') {
    return (
      <div className="card p-6">
        <h1 className="text-xl font-semibold text-slate-900">{language === 'kaz' ? 'Құқық жеткіліксіз' : 'Недостаточно прав'}</h1>
        <p className="mt-2 text-sm text-slate-600">{language === 'kaz' ? 'Бұл бет тек әкімшіге қолжетімді.' : 'Эта страница доступна только администратору.'}</p>
        <Link href="/" className="mt-4 inline-flex text-sm font-semibold text-brand-700 hover:text-brand-800">
          {language === 'kaz' ? 'Басты бетке оралу' : 'Вернуться на главную'}
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
