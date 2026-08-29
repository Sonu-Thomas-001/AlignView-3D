import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { parseSTLFilename } from '@/utils/stlParser';

export async function GET() {
  try {
    const stlDir = path.join(process.cwd(), 'STL');

    if (!fs.existsSync(stlDir)) {
      return NextResponse.json({ files: [] });
    }

    const fileNames = fs.readdirSync(stlDir).filter(f => f.toLowerCase().endsWith('.stl'));

    const files = fileNames.map(name => {
      const filePath = path.join(stlDir, name);
      const stats = fs.statSync(filePath);
      const parsed = parseSTLFilename(name);
      const sizeMb = (stats.size / (1024 * 1024)).toFixed(1);

      return {
        id: `stl_${name.replace(/[^a-zA-Z0-9_-]/g, '_')}`,
        name,
        arch: parsed.arch === 'lower' ? 'lower' : 'upper',
        stage: parsed.stage || 1,
        date: '29 Aug 2026',
        fileSize: `${sizeMb} MB`,
        verticesCount: 871800,
        trianglesCount: 290600,
        dimensions: {
          width: 63.0,
          depth: 51.9,
          height: 15.6,
        },
        customUrl: `/api/stl-files/${encodeURIComponent(name)}`,
      };
    });

    return NextResponse.json({ files });
  } catch (error) {
    console.error('Failed to read STL folder:', error);
    return NextResponse.json({ error: 'Failed to read STL directory' }, { status: 500 });
  }
}
