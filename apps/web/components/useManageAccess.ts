'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { PROFILE_UPDATED_EVENT } from '@/lib/profile-events';

interface MeResponse {
  roles: string[];
}

const hasManageRole = (roles: string[]): boolean => roles.includes('STAFF') || roles.includes('ADMIN');

export function useManageAccess(): boolean {
  const [canManage, setCanManage] = useState(false);

  useEffect(() => {
    let active = true;

    const load = async (): Promise<void> => {
      try {
        const me = await apiFetch<MeResponse>('/auth/me');
        if (!active) return;
        const roles = Array.isArray(me.roles) ? me.roles : [];
        setCanManage(hasManageRole(roles));
      } catch {
        if (active) {
          setCanManage(false);
        }
      }
    };

    const refresh = (): void => {
      void load();
    };

    void load();

    window.addEventListener(PROFILE_UPDATED_EVENT, refresh);
    window.addEventListener('focus', refresh);

    return () => {
      active = false;
      window.removeEventListener(PROFILE_UPDATED_EVENT, refresh);
      window.removeEventListener('focus', refresh);
    };
  }, []);

  return canManage;
}
