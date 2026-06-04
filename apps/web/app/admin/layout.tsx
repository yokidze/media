'use client';

import { usePathname } from 'next/navigation';
import { AdminSidebar } from '@/components/AdminSidebar';
import { AdminAccessGate } from '@/components/AdminAccessGate';

export default function AdminLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  const pathname = usePathname();
  const isTeacherCreateFlow = pathname === '/admin/items/new' || /^\/admin\/items\/[0-9a-f-]+$/i.test(pathname);

  if (isTeacherCreateFlow) {
    return (
      <AdminAccessGate>
        <div className="container-shell py-8 md:py-10">
          <div className="mx-auto max-w-4xl">{children}</div>
        </div>
      </AdminAccessGate>
    );
  }

  return (
    <AdminAccessGate>
      <div className="container-shell py-10">
        <div className="grid gap-6 lg:grid-cols-[250px_1fr]">
          <AdminSidebar />
          <div>{children}</div>
        </div>
      </div>
    </AdminAccessGate>
  );
}
