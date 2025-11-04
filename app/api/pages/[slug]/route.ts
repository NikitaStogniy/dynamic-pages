import { NextRequest, NextResponse } from 'next/server';
import { db, pages, sessions } from '@/lib/db';
import { eq, and } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const resolvedParams = await params;
  try {
    const authHeader = request.headers.get('authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const sessionToken = authHeader.substring(7);
      const session = await db.query.sessions.findFirst({
        where: eq(sessions.sessionToken, sessionToken),
      });

      if (session && session.expiresAt >= new Date()) {
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
    }

    const publicPage = await db.query.pages.findFirst({
      where: eq(pages.slug, resolvedParams.slug),
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
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const sessionToken = authHeader.substring(7);
    const session = await db.query.sessions.findFirst({
      where: eq(sessions.sessionToken, sessionToken),
    });

    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, content } = body;

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
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const sessionToken = authHeader.substring(7);
    const session = await db.query.sessions.findFirst({
      where: eq(sessions.sessionToken, sessionToken),
    });

    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Invalid or expired session' },
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