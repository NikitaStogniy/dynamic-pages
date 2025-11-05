import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { pageAccessTokens, pages } from '@/lib/db/schema';
import { eq, and, gt } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // Find token and join with page
    const result = await db
      .select({
        token: pageAccessTokens,
        page: pages,
      })
      .from(pageAccessTokens)
      .innerJoin(pages, eq(pages.id, pageAccessTokens.pageId))
      .where(
        and(
          eq(pageAccessTokens.token, token),
          gt(pageAccessTokens.expiresAt, new Date())
        )
      )
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 404 }
      );
    }

    const { token: accessToken, page } = result[0];

    return NextResponse.json({
      valid: true,
      page: {
        id: page.id,
        title: page.title,
        slug: page.slug,
        content: page.content,
      },
      expiresAt: accessToken.expiresAt,
    });
  } catch (error) {
    console.error('Error verifying access token:', error);
    return NextResponse.json(
      { error: 'Failed to verify token' },
      { status: 500 }
    );
  }
}
