import { NextResponse } from 'next/server';
import { getResult } from '@/lib/store';

export async function GET(request, { params }) {
  const { id } = await params;
  const result = getResult(id);
  if (!result) {
    return NextResponse.json({ error: 'Result not found or expired' }, { status: 404 });
  }
  return NextResponse.json(result);
}
