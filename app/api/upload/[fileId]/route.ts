import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const TMP_DIR = path.join(process.cwd(), 'tmp', 'uploads');
const FINAL_DIR = path.join(process.cwd(), 'public', 'uploads');

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ fileId: string }> },
) {
  const { fileId } = await params;

  if (!fileId) {
    return NextResponse.json({ error: 'Missing fileId' }, { status: 400 });
  }

  const chunkDir = path.join(TMP_DIR, fileId);

  if (!fs.existsSync(chunkDir)) {
    return NextResponse.json({ received: [] });
  }

  const received = fs
    .readdirSync(chunkDir)
    .filter((f) => /^\d+$/.test(f))
    .map(Number);

  return NextResponse.json({ received });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ fileId: string }> },
) {
  const { fileId } = await params;

  if (!fileId) {
    return NextResponse.json({ error: 'Missing fileId' }, { status: 400 });
  }

  try {
    if (!fs.existsSync(FINAL_DIR)) {
      return NextResponse.json({ success: true });
    }
    const files = fs.readdirSync(FINAL_DIR).filter((f) => f.startsWith(`${fileId}_`));
    for (const f of files) {
      fs.rmSync(path.join(FINAL_DIR, f), { force: true });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete upload error:', error);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}
