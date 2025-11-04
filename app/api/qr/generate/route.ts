import { NextRequest, NextResponse } from 'next/server';
import { generateQRCode, generateQRCodeBuffer } from '@/lib/utils/qrcode';
import { db, qrCodes, NewQRCode } from '@/lib/db';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { text, format = 'dataurl', save = false } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'Text parameter is required' },
        { status: 400 }
      );
    }

    let result;
    
    if (format === 'buffer') {
      const buffer = await generateQRCodeBuffer(text);
      
      if (save) {
        const code = `qr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newQRCode: NewQRCode = {
          code,
          targetUrl: text,
        };
        await db.insert(qrCodes).values(newQRCode);
      }
      
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'image/png',
        },
      });
    } else {
      result = await generateQRCode(text);
      
      if (save) {
        const code = `qr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newQRCode: NewQRCode = {
          code,
          targetUrl: text,
        };
        const [savedQR] = await db.insert(qrCodes).values(newQRCode).returning();
        
        return NextResponse.json({
          qrCode: result,
          saved: true,
          code: savedQR.code,
          id: savedQR.id,
        });
      }
      
      return NextResponse.json({ qrCode: result });
    }
  } catch (error) {
    console.error('Error in QR generation API:', error);
    return NextResponse.json(
      { error: 'Failed to generate QR code' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const text = searchParams.get('text');
  
  if (!text) {
    return NextResponse.json(
      { error: 'Text parameter is required' },
      { status: 400 }
    );
  }
  
  try {
    const buffer = await generateQRCodeBuffer(text);
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/png',
      },
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    return NextResponse.json(
      { error: 'Failed to generate QR code' },
      { status: 500 }
    );
  }
}