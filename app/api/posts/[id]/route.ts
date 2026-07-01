// MOCK ROUTE - FOR DEVELOPMENT AND MANUAL TESTING ONLY
// This route is not a real API and should never run in production.

import { NextRequest, NextResponse } from 'next/server';
import { posts } from '../_store';

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (process.env.NODE_ENV !== 'development') {
    return new NextResponse('Not Found', { status: 404 });
  }
  const { id } = await params;
  const index = posts.findIndex((post) => post.id === id);
  if (index === -1) {
    return NextResponse.json({ error: 'not-found' }, { status: 404 });
  }
  posts.splice(index, 1);
  return NextResponse.json({ id });
}
