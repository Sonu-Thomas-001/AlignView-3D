import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await context.params;
    const decodedName = decodeURIComponent(filename);
    const filePath = path.join(process.cwd(), 'STL', decodedName);

    if (!fs.existsSync(filePath)) {
      return new NextResponse('File not found', { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'model/stl',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Disposition': `inline; filename="${decodedName}"`,
      },
    });
  } catch (error) {
    console.error('Error serving STL file:', error);
    return new NextResponse('Error reading STL file', { status: 500 });
  }
}
