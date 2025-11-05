import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { pages, pageAccessTokens } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { randomBytes } from 'crypto';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Get the page
    const [page] = await db
      .select()
      .from(pages)
      .where(eq(pages.slug, slug))
      .limit(1);

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    // Check if page has qrExpiryMinutes set
    if (!page.qrExpiryMinutes) {
      // No expiry set, return null token (use regular page URL)
      return NextResponse.json({
        token: null,
        expiresAt: null,
        message: 'Page has no expiry configured'
      });
    }

    // Generate unique token
    const token = randomBytes(32).toString('hex');

    // Calculate expiry time
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + page.qrExpiryMinutes);

    // Store token in database
    const [accessToken] = await db
      .insert(pageAccessTokens)
      .values({
        pageId: page.id,
        token,
        expiresAt,
      })
      .returning();

    return NextResponse.json({
      token: accessToken.token,
      expiresAt: accessToken.expiresAt,
      expiryMinutes: page.qrExpiryMinutes,
    });
  } catch (error) {
    console.error('Error generating access token:', error);
    return NextResponse.json(
      { error: 'Failed to generate access token' },
      { status: 500 }
    );
  }
}
