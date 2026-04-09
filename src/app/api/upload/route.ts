import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Check file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Max 50MB.' }, { status: 400 });
    }

    const type = file.type;
    let content = '';

    if (type === 'text/plain' || type === 'text/markdown') {
      content = await file.text();
    } else if (type === 'application/pdf') {
      // In production, use pdf-parse on server side
      // For Vercel deployment, we'll handle PDF parsing client-side
      content = `[PDF file: ${file.name}] - PDF parsing would happen server-side in production`;
    } else if (type.startsWith('image/')) {
      // Convert image to base64 for vision API
      const arrayBuffer = await file.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      content = `data:${type};base64,${base64}`;
    } else if (type === 'text/csv') {
      content = await file.text();
    } else {
      content = `[File: ${file.name}] - Unsupported type: ${type}`;
    }

    return NextResponse.json({
      name: file.name,
      type,
      size: file.size,
      content,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
