// MOCK ROUTE - FOR DEVELOPMENT AND MANUAL TESTING ONLY
// This route is not a real API and should never run in production.

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return new NextResponse('Not Found', { status: 404 });
  }
  const { searchParams } = new URL(request.url);
  const fileId = searchParams.get('fileId');
  const indexStr = searchParams.get('index');
  const totalStr = searchParams.get('total');
  const filename = searchParams.get('filename') || 'file';

  if (!fileId || !indexStr || !totalStr) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  const index = parseInt(indexStr, 10);
  const total = parseInt(totalStr, 10);

  if (isNaN(index) || isNaN(total)) {
    return NextResponse.json({ error: 'Invalid index or total parameters' }, { status: 400 });
  }

  try {
    // Add a 15-second delay to allow manual testing of loading state in development
    await new Promise((resolve) => setTimeout(resolve, 15000));

    const arrayBuffer = await request.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Keep safe characters in filename
    const safeBaseName = path.basename(filename).replace(/[^a-zA-Z0-9.-]/g, '_');
    const safeFilename = `${fileId}_${safeBaseName}`;
    const filePath = path.join(uploadDir, safeFilename);

    if (index === 0) {
      fs.writeFileSync(filePath, buffer);
    } else {
      fs.appendFileSync(filePath, buffer);
    }

    if (index === total - 1) {
      const fileUrl = `/uploads/${safeFilename}`;
      return NextResponse.json({ url: fileUrl });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Upload chunk error:', error);
    return NextResponse.json({ error: 'Internal server error during upload' }, { status: 500 });
  }
}
