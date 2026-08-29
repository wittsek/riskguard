'use client';

import { AuthProvider } from '@/lib/auth/auth-context';
import { AuditSessionProvider } from '@/lib/store/audit-session';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuditSessionProvider>{children}</AuditSessionProvider>
    </AuthProvider>
  );
}
