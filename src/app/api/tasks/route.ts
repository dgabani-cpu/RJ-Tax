import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  try {
    const tasks = await prisma.task.findMany({
      orderBy: { dueDate: 'asc' },
    });
    return NextResponse.json({ success: true, data: tasks });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newTask = await prisma.task.create({
      data: {
        id: body.id || `task-${Date.now()}`,
        clientId: body.clientId,
        clientName: body.clientName,
        title: body.title,
        description: body.description,
        assignedStaffId: body.assignedStaffId,
        assignedStaffName: body.assignedStaffName,
        priority: body.priority || 'MEDIUM',
        dueDate: body.dueDate,
        status: body.status || 'PENDING',
        category: body.category || 'GST_FILING',
        createdAt: body.createdAt || new Date().toISOString(),
        commentsCount: body.commentsCount || 0,
      },
    });
    return NextResponse.json({ success: true, data: newTask }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
