import { NextRequest, NextResponse } from 'next/server';
import { db, pages, NewPage, sessions } from '@/lib/db';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
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

    const searchParams = request.nextUrl.searchParams;
    const published = searchParams.get('published');
    
    // Note: All filtering by published status has been removed
    
    const userPages = await db.query.pages.findMany({
      where: eq(pages.userId, session.userId),
    });
    return NextResponse.json(userPages);
  } catch (error) {
    console.error('Error fetching pages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pages' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    // Check page limit
    const userPagesCount = await db.query.pages.findMany({
      where: eq(pages.userId, session.userId),
    });

    if (userPagesCount.length >= 5) {
      return NextResponse.json(
        { error: 'You have reached the maximum limit of 5 pages' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, slug, content } = body;

    if (!title || !slug) {
      return NextResponse.json(
        { error: 'Title and slug are required' },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const existingPage = await db.query.pages.findFirst({
      where: eq(pages.slug, slug),
    });

    if (existingPage) {
      // Try to generate a new unique slug server-side as a fallback
      let newSlug = null;
      for (let i = 0; i < 10; i++) {
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let tempSlug = '';
        for (let j = 0; j < 8; j++) {
          tempSlug += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        const checkPage = await db.query.pages.findFirst({
          where: eq(pages.slug, tempSlug),
        });
        
        if (!checkPage) {
          newSlug = tempSlug;
          break;
        }
      }
      
      if (!newSlug) {
        return NextResponse.json(
          { error: 'Unable to generate unique slug. Please try again.' },
          { status: 400 }
        );
      }
      
      // Use the newly generated unique slug
      console.log(`Slug collision detected. Generated new slug: ${newSlug}`);
      const newPage: NewPage = {
        userId: session.userId,
        title,
        slug: newSlug,
        content: content || {},
      };

      const [createdPage] = await db.insert(pages).values(newPage).returning();
      return NextResponse.json(createdPage, { status: 201 });
    }

    const newPage: NewPage = {
      userId: session.userId,
      title,
      slug,
      content: content || {},
    };

    const [createdPage] = await db.insert(pages).values(newPage).returning();
    
    return NextResponse.json(createdPage, { status: 201 });
  } catch (error) {
    console.error('Error creating page:', error);
    return NextResponse.json(
      { error: 'Failed to create page' },
      { status: 500 }
    );
  }
}