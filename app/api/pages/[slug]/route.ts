import { NextRequest, NextResponse } from 'next/server';
import { db, pages } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { verifySession } from '@/lib/auth/session';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const resolvedParams = await params;
  try {
    // Try to verify session from httpOnly cookie
    const session = await verifySession();

    if (session) {
      // If authenticated, try to get user's page
      const page = await db.query.pages.findFirst({
        where: and(
          eq(pages.slug, resolvedParams.slug),
          eq(pages.userId, session.userId)
        ),
      });

      if (page) {
        return NextResponse.json(page);
      }
    }

    // Fall back to public page if not authenticated or page not found for user
    // Only return pages that are published
    const publicPage = await db.query.pages.findFirst({
      where: and(
        eq(pages.slug, resolvedParams.slug),
        eq(pages.isPublished, true)
      ),
    });

    if (!publicPage) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(publicPage);
  } catch (error) {
    console.error('Error fetching page:', error);
    return NextResponse.json(
      { error: 'Failed to fetch page' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const resolvedParams = await params;
  try {
    // Verify session from httpOnly cookie
    const session = await verifySession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, content, isPublished, qrExpiryMinutes } = body;

    const existingPage = await db.query.pages.findFirst({
      where: and(
        eq(pages.slug, resolvedParams.slug),
        eq(pages.userId, session.userId)
      ),
    });

    if (!existingPage) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      );
    }

    const [updatedPage] = await db
      .update(pages)
      .set({
        title: title || existingPage.title,
        content: content !== undefined ? content : existingPage.content,
        isPublished: isPublished !== undefined ? isPublished : existingPage.isPublished,
        qrExpiryMinutes: qrExpiryMinutes !== undefined ? qrExpiryMinutes : existingPage.qrExpiryMinutes,
        updatedAt: new Date(),
      })
      .where(and(
        eq(pages.slug, resolvedParams.slug),
        eq(pages.userId, session.userId)
      ))
      .returning();

    return NextResponse.json(updatedPage);
  } catch (error) {
    console.error('Error updating page:', error);
    return NextResponse.json(
      { error: 'Failed to update page' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const resolvedParams = await params;
  try {
    // Verify session from httpOnly cookie
    const session = await verifySession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const existingPage = await db.query.pages.findFirst({
      where: and(
        eq(pages.slug, resolvedParams.slug),
        eq(pages.userId, session.userId)
      ),
    });

    if (!existingPage) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      );
    }

    await db.delete(pages).where(and(
      eq(pages.slug, resolvedParams.slug),
      eq(pages.userId, session.userId)
    ));

    return NextResponse.json({ message: 'Page deleted successfully' });
  } catch (error) {
    console.error('Error deleting page:', error);
    return NextResponse.json(
      { error: 'Failed to delete page' },
      { status: 500 }
    );
  }
}