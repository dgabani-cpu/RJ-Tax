import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    const where = clientId ? { clientId } : {};
    const items = await prisma.reconciliationItem.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    const formatted = items.map((item) => ({
      ...item,
      purchaseInvoice: item.purchaseInvoice ? JSON.parse(item.purchaseInvoice) : undefined,
      gstr2bRecord: item.gstr2bRecord ? JSON.parse(item.gstr2bRecord) : undefined,
      discrepancyDiff: item.discrepancyDiff ? JSON.parse(item.discrepancyDiff) : undefined,
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (Array.isArray(body)) {
      const createdList = [];
      for (const item of body) {
        const prepared = {
          id: item.id || `recon-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          clientId: item.clientId,
          financialYear: item.financialYear,
          taxPeriod: item.taxPeriod,
          matchCategory: item.matchCategory,
          categoryLabel: item.categoryLabel,
          purchaseInvoice: item.purchaseInvoice ? JSON.stringify(item.purchaseInvoice) : null,
          gstr2bRecord: item.gstr2bRecord ? JSON.stringify(item.gstr2bRecord) : null,
          discrepancyDiff: item.discrepancyDiff ? JSON.stringify(item.discrepancyDiff) : null,
          aiExplanation: item.aiExplanation || '',
          suggestedAction: item.suggestedAction || '',
          resolutionStatus: item.resolutionStatus || 'PENDING',
          userNotes: item.userNotes || null,
          reviewedBy: item.reviewedBy || null,
          reviewedAt: item.reviewedAt || null,
        };

        const created = await prisma.reconciliationItem.upsert({
          where: { id: prepared.id },
          update: prepared,
          create: prepared,
        });
        createdList.push(created);
      }
      return NextResponse.json({ success: true, count: createdList.length });
    }

    const prepared = {
      id: body.id || `recon-${Date.now()}`,
      clientId: body.clientId,
      financialYear: body.financialYear,
      taxPeriod: body.taxPeriod,
      matchCategory: body.matchCategory,
      categoryLabel: body.categoryLabel,
      purchaseInvoice: body.purchaseInvoice ? JSON.stringify(body.purchaseInvoice) : null,
      gstr2bRecord: body.gstr2bRecord ? JSON.stringify(body.gstr2bRecord) : null,
      discrepancyDiff: body.discrepancyDiff ? JSON.stringify(body.discrepancyDiff) : null,
      aiExplanation: body.aiExplanation || '',
      suggestedAction: body.suggestedAction || '',
      resolutionStatus: body.resolutionStatus || 'PENDING',
      userNotes: body.userNotes || null,
      reviewedBy: body.reviewedBy || null,
      reviewedAt: body.reviewedAt || null,
    };

    const created = await prisma.reconciliationItem.create({
      data: prepared,
    });

    const formatted = {
      ...created,
      purchaseInvoice: created.purchaseInvoice ? JSON.parse(created.purchaseInvoice) : undefined,
      gstr2bRecord: created.gstr2bRecord ? JSON.parse(created.gstr2bRecord) : undefined,
      discrepancyDiff: created.discrepancyDiff ? JSON.parse(created.discrepancyDiff) : undefined,
    };

    return NextResponse.json({ success: true, data: formatted }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
