// MOCK ROUTE - FOR DEVELOPMENT AND MANUAL TESTING ONLY
// This route is not a real API and should never run in production.

import { NextRequest, NextResponse } from 'next/server';
import { posts } from './_store';

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return new NextResponse('Not Found', { status: 404 });
  }
  const status = request.nextUrl.searchParams.get('status');
  const filtered = status ? posts.filter((post) => post.status === status) : posts;
  return NextResponse.json(filtered);
}

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return new NextResponse('Not Found', { status: 404 });
  }
  try {
    const body = await request.json();
    console.log('Received post submission payload:', body);

    // Basic validation
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const mockPostId = `post-mock-${crypto.randomUUID()}`;
    posts.unshift({
      id: mockPostId,
      title: body.title ?? 'پست جدید',
      sellerName: 'گالری طلای مدرن',
      sellerAvatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=500&q=80',
      isVerified: true,
      caption: body.caption ?? '',
      mediaUrls: Array.isArray(body.mediaUrls) ? body.mediaUrls : [],
      submittedAt: new Date().toISOString(),
      status: 'pending',
    });
    return NextResponse.json({ id: mockPostId }, { status: 201 });
  } catch (error) {
    console.error('Create post error:', error);
    return NextResponse.json({ error: 'Internal server error during post creation' }, { status: 500 });
  }
}
