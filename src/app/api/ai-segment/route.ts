import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

const AI_WORKER_URL = process.env.AI_WORKER_URL || 'http://127.0.0.1:8000';

export async function GET() {
  try {
    const res = await fetch(`${AI_WORKER_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(1200),
    });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json({ online: true, ...data });
    }
  } catch {
    // Worker offline
  }

  return NextResponse.json({
    online: false,
    message: 'Local MeshSegNet AI worker offline. Using high-precision in-browser engine.',
  });
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as Blob | null;
    const filename = (formData.get('filename') as string) || 'model.stl';
    const arch = (formData.get('arch') as string) || 'upper';

    let fileBuffer: Buffer | null = null;

    if (file) {
      fileBuffer = Buffer.from(await file.arrayBuffer());
    } else if (filename) {
      // Check local STL directory
      const stlPath = path.join(process.cwd(), 'STL', filename);
      if (fs.existsSync(stlPath)) {
        fileBuffer = fs.readFileSync(stlPath);
      }
    }

    if (!fileBuffer) {
      return NextResponse.json({ error: 'No STL file provided' }, { status: 400 });
    }

    // Attempt to forward to local Python AI worker
    try {
      const aiFormData = new FormData();
      const blob = new Blob([fileBuffer as unknown as BlobPart], { type: 'application/octet-stream' });
      aiFormData.append('file', blob, filename);

      const aiResponse = await fetch(`${AI_WORKER_URL}/segment?arch=${arch}`, {
        method: 'POST',
        body: aiFormData,
        signal: AbortSignal.timeout(8000),
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        return NextResponse.json({
          source: 'meshsegnet-ai',
          ...aiData,
        });
      }
    } catch {
      // Worker offline or timed out
    }

    return NextResponse.json({
      source: 'in-browser-fallback',
      success: false,
      message: 'MeshSegNet worker unreachable; falling back to in-browser 3D curvature segmenter',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
