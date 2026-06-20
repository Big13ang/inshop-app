// MOCK ROUTE - FOR DEVELOPMENT AND MANUAL TESTING ONLY
// This route is not a real API and should never run in production.

import { NextRequest, NextResponse } from 'next/server';

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

    // Return a mock post ID
    const mockPostId = `post-mock-${Math.floor(Math.random() * 10000)}`;
    return NextResponse.json({ id: mockPostId }, { status: 201 });
  } catch (error) {
    console.error('Create post error:', error);
    return NextResponse.json({ error: 'Internal server error during post creation' }, { status: 500 });
  }
}
