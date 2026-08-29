import { type NextRequest, NextResponse } from 'next/server';
import { SAMPLE_AUDIT_ALIAS_PATH, SAMPLE_AUDIT_PATH } from '@/lib/pricing';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === SAMPLE_AUDIT_PATH) {
    const url = request.nextUrl.clone();
    url.pathname = SAMPLE_AUDIT_ALIAS_PATH;
    return NextResponse.rewrite(url);
  }
  return updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
