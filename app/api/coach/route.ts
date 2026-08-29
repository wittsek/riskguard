import { NextResponse } from 'next/server';
import { generateCoaching, parseCoachRequest } from '@/lib/ai';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const parsed = parseCoachRequest(body);
  if ('error' in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const coaching = await generateCoaching(parsed);
    return NextResponse.json(coaching);
  } catch {
    return NextResponse.json({ error: 'Could not generate coaching notes.' }, { status: 500 });
  }
}
