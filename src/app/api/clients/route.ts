import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  try {
    const clients = await prisma.client.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const formattedClients = clients.map((c) => ({
      ...c,
      authorizedPerson: JSON.parse(c.authorizedPerson || '{}'),
      dueDates: JSON.parse(c.dueDates || '{}'),
      assignedStaff: JSON.parse(c.assignedStaff || '[]'),
    }));

    return NextResponse.json({ success: true, data: formattedClients });
  } catch (error: any) {
    console.error('API Error /api/clients GET:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Check if bulk import or single item
    if (Array.isArray(body)) {
      const createdList = [];
      for (const clientItem of body) {
        const preparedData = {
          ...clientItem,
          id: clientItem.id || `cli-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          authorizedPerson: JSON.stringify(clientItem.authorizedPerson || {}),
          dueDates: JSON.stringify(clientItem.dueDates || {}),
          assignedStaff: JSON.stringify(clientItem.assignedStaff || []),
          createdAt: clientItem.createdAt || new Date().toISOString(),
          updatedAt: clientItem.updatedAt || new Date().toISOString(),
        };
        const created = await prisma.client.upsert({
          where: { clientId: preparedData.clientId },
          update: preparedData,
          create: preparedData,
        });
        createdList.push(created);
      }
      return NextResponse.json({ success: true, count: createdList.length });
    }

    const preparedData = {
      ...body,
      id: body.id || `cli-${Date.now()}`,
      authorizedPerson: JSON.stringify(body.authorizedPerson || {}),
      dueDates: JSON.stringify(body.dueDates || {}),
      assignedStaff: JSON.stringify(body.assignedStaff || []),
      createdAt: body.createdAt || new Date().toISOString(),
      updatedAt: body.updatedAt || new Date().toISOString(),
    };

    const created = await prisma.client.create({
      data: preparedData,
    });

    const formatted = {
      ...created,
      authorizedPerson: JSON.parse(created.authorizedPerson || '{}'),
      dueDates: JSON.parse(created.dueDates || '{}'),
      assignedStaff: JSON.parse(created.assignedStaff || '[]'),
    };

    return NextResponse.json({ success: true, data: formatted }, { status: 201 });
  } catch (error: any) {
    console.error('API Error /api/clients POST:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
