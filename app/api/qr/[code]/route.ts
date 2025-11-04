import { NextRequest, NextResponse } from 'next/server';
import { db, qrCodes } from '@/lib/db';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const resolvedParams = await params;
  try {
    const qrCode = await db.query.qrCodes.findFirst({
      where: eq(qrCodes.code, resolvedParams.code),
    });

    if (!qrCode) {
      return NextResponse.json(
        { error: 'QR code not found' },
        { status: 404 }
      );
    }

    await db
      .update(qrCodes)
      .set({ scans: (qrCode.scans || 0) + 1 })
      .where(eq(qrCodes.id, qrCode.id));

    return NextResponse.redirect(qrCode.targetUrl);
  } catch (error) {
    console.error('Error processing QR code redirect:', error);
    return NextResponse.json(
      { error: 'Failed to process QR code' },
      { status: 500 }
    );
  }
}