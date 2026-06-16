import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import fs from 'fs';
import path from 'path';

const TMP_DIR = path.join(process.cwd(), 'tmp', 'uploads');

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fileId = searchParams.get('fileId');
  const indexStr = searchParams.get('index');
  const totalStr = searchParams.get('total');
  const filename = searchParams.get('filename') || 'file';
  const clientChecksum = request.headers.get('x-chunk-checksum');

  if (!fileId || !indexStr || !totalStr) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  if (!clientChecksum) {
    return NextResponse.json({ error: 'Missing X-Chunk-Checksum header' }, { status: 400 });
  }

  const index = parseInt(indexStr, 10);
  const total = parseInt(totalStr, 10);

  if (isNaN(index) || isNaN(total) || index < 0 || index >= total) {
    return NextResponse.json({ error: 'Invalid index or total' }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await request.arrayBuffer());

    // Verify integrity before writing
    const serverChecksum = createHash('sha256').update(buffer).digest('hex');
    if (serverChecksum !== clientChecksum) {
      return NextResponse.json({ error: 'Checksum mismatch' }, { status: 400 });
    }

    const chunkDir = path.join(TMP_DIR, fileId);
    fs.mkdirSync(chunkDir, { recursive: true });

    // Store filename for later assembly
    const metaPath = path.join(chunkDir, '_meta.json');
    if (!fs.existsSync(metaPath)) {
      const safeBase = path.basename(filename).replace(/[^a-zA-Z0-9.-]/g, '_');
      fs.writeFileSync(metaPath, JSON.stringify({ filename: safeBase, total }));
    }

    // Write chunk atomically: temp file → rename
    const chunkPath = path.join(chunkDir, `${index}`);
    const tmpPath = `${chunkPath}.tmp`;
    fs.writeFileSync(tmpPath, buffer);
    fs.renameSync(tmpPath, chunkPath);

    return NextResponse.json({ success: true, index });
  } catch (error) {
    console.error('Upload chunk error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
