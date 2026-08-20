import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const client = await prisma.client.findUnique({
      where: { id: params.id },
    });

    if (!client) {
      return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
    }

    const formatted = {
      ...client,
      authorizedPerson: JSON.parse(client.authorizedPerson || '{}'),
      dueDates: JSON.parse(client.dueDates || '{}'),
      assignedStaff: JSON.parse(client.assignedStaff || '[]'),
    };

    return NextResponse.json({ success: true, data: formatted });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();

    const updateData: any = { ...body };
    delete updateData.id;

    if (body.authorizedPerson && typeof body.authorizedPerson === 'object') {
      updateData.authorizedPerson = JSON.stringify(body.authorizedPerson);
    }
    if (body.dueDates && typeof body.dueDates === 'object') {
      updateData.dueDates = JSON.stringify(body.dueDates);
    }
    if (body.assignedStaff && Array.isArray(body.assignedStaff)) {
      updateData.assignedStaff = JSON.stringify(body.assignedStaff);
    }
    updateData.updatedAt = new Date().toISOString();

    const updated = await prisma.client.update({
      where: { id: params.id },
      data: updateData,
    });

    const formatted = {
      ...updated,
      authorizedPerson: JSON.parse(updated.authorizedPerson || '{}'),
      dueDates: JSON.parse(updated.dueDates || '{}'),
      assignedStaff: JSON.parse(updated.assignedStaff || '[]'),
    };

    return NextResponse.json({ success: true, data: formatted });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.client.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: 'Client deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
