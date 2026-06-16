import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const TMP_DIR = path.join(process.cwd(), 'tmp', 'uploads');
const FINAL_DIR = path.join(process.cwd(), 'public', 'uploads');

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> },
) {
  const { fileId } = await params;
  const { searchParams } = new URL(request.url);
  const totalStr = searchParams.get('total');

  if (!fileId || !totalStr) {
    return NextResponse.json({ error: 'Missing fileId or total' }, { status: 400 });
  }

  const total = parseInt(totalStr, 10);
  if (isNaN(total) || total < 1) {
    return NextResponse.json({ error: 'Invalid total' }, { status: 400 });
  }

  const chunkDir = path.join(TMP_DIR, fileId);

  if (!fs.existsSync(chunkDir)) {
    return NextResponse.json({ error: 'Upload session not found' }, { status: 404 });
  }

  // Verify every chunk is present before assembling
  const presentChunks = fs
    .readdirSync(chunkDir)
    .filter((f) => /^\d+$/.test(f))
    .map(Number);

  if (presentChunks.length < total) {
    const missing = Array.from({ length: total }, (_, i) => i).filter(
      (i) => !presentChunks.includes(i),
    );
    return NextResponse.json(
      { error: 'Missing chunks', missing },
      { status: 409 },
    );
  }

  try {
    const metaPath = path.join(chunkDir, '_meta.json');
    const meta = fs.existsSync(metaPath)
      ? (JSON.parse(fs.readFileSync(metaPath, 'utf-8')) as { filename: string; total: number })
      : { filename: 'file', total };

    const safeFilename = `${fileId}_${meta.filename}`;
    fs.mkdirSync(FINAL_DIR, { recursive: true });
    const finalPath = path.join(FINAL_DIR, safeFilename);

    const out = fs.createWriteStream(finalPath);
    for (let i = 0; i < total; i++) {
      out.write(fs.readFileSync(path.join(chunkDir, `${i}`)));
    }
    await new Promise<void>((resolve, reject) => {
      out.end();
      out.on('finish', resolve);
      out.on('error', reject);
    });

    fs.rmSync(chunkDir, { recursive: true, force: true });

    return NextResponse.json({ url: `/uploads/${safeFilename}` });
  } catch (error) {
    console.error('Finalize error:', error);
    return NextResponse.json({ error: 'Assembly failed' }, { status: 500 });
  }
}
