import fs from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { Server } from '@tus/server';
import { FileStore } from '@tus/file-store';

// Mock backend — swap for the real upload service once it's available.
const UPLOAD_DIR = path.join(process.cwd(), 'tmp', 'uploads');

const server = new Server({
  path: '/api/upload',
  datastore: new FileStore({ directory: UPLOAD_DIR }),
  // Keeps the tus upload id aligned with the media item id the client tracks,
  // so the existing DELETE /api/upload/:id call in useMediaUpload still works.
  namingFunction: (req, metadata) => metadata?.id ?? crypto.randomUUID(),
});

export const POST = server.handleWeb.bind(server);
export const PATCH = server.handleWeb.bind(server);
export const HEAD = server.handleWeb.bind(server);
export const DELETE = server.handleWeb.bind(server);
export const OPTIONS = server.handleWeb.bind(server);

// tus has no download method in its core protocol — serve the stored file
// ourselves so uploaded media can be previewed by URL.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug?: string[] }> },
) {
  const { slug } = await params;
  const id = slug?.[0];
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const filePath = path.join(UPLOAD_DIR, id);
  const metaPath = `${filePath}.json`;
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const meta = fs.existsSync(metaPath)
    ? (JSON.parse(fs.readFileSync(metaPath, 'utf-8')) as { metadata?: Record<string, string> })
    : undefined;
  const contentType = meta?.metadata?.filetype ?? 'application/octet-stream';

  return new NextResponse(fs.readFileSync(filePath), {
    headers: { 'Content-Type': contentType },
  });
}
