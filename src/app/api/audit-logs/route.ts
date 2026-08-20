import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  try {
    const logs = await prisma.auditLogItem.findMany({
      orderBy: { timestamp: 'desc' },
      take: 100,
    });
    return NextResponse.json({ success: true, data: logs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newLog = await prisma.auditLogItem.create({
      data: {
        id: body.id || `aud-${Date.now()}`,
        userId: body.userId || 'usr-1',
        userName: body.userName || 'Neel Gabani',
        userRole: body.userRole || 'Super Admin',
        action: body.action,
        resourceType: body.resourceType || 'SYSTEM',
        clientName: body.clientName || null,
        ipAddress: body.ipAddress || '127.0.0.1',
        userAgent: body.userAgent || 'TaxNexus Web Client',
        timestamp: body.timestamp || new Date().toLocaleString(),
        details: body.details || '',
      },
    });

    return NextResponse.json({ success: true, data: newLog }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
