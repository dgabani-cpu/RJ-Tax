import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    const where = clientId ? { clientId } : {};
    const documents = await prisma.documentItem.findMany({
      where,
      orderBy: { uploadedAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: documents });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newDoc = await prisma.documentItem.create({
      data: {
        id: body.id || `doc-${Date.now()}`,
        clientId: body.clientId,
        clientName: body.clientName,
        category: body.category || 'Client Documents',
        fileName: body.fileName,
        fileSize: body.fileSize || '100 KB',
        fileType: body.fileType || 'PDF',
        version: body.version || 'v1.0',
        uploadedBy: body.uploadedBy || 'System User',
        uploadedAt: body.uploadedAt || new Date().toISOString(),
        downloadUrl: body.downloadUrl || '#',
      },
    });

    return NextResponse.json({ success: true, data: newDoc }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
