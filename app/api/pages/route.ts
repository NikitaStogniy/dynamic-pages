import { NextRequest, NextResponse } from 'next/server';
import { db, pages, NewPage } from '@/lib/db';
import { eq, inArray } from 'drizzle-orm';
import { USER_LIMITS } from '@/lib/constants';
import { generateSlugCandidates, isValidSlug } from '@/lib/utils/slug';
import { createPageSchema } from '@/lib/validation/schemas';
import { verifySession } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  try {
    // Verify session from httpOnly cookie
    const session = await verifySession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userPages = await db.query.pages.findMany({
      where: eq(pages.userId, session.userId),
    });

    return NextResponse.json(userPages);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching pages:', error);
    }
    return NextResponse.json(
      { error: 'Failed to fetch pages' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify session from httpOnly cookie
    const session = await verifySession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check page limit
    const userPagesCount = await db.query.pages.findMany({
      where: eq(pages.userId, session.userId),
    });

    if (userPagesCount.length >= USER_LIMITS.MAX_PAGES) {
      return NextResponse.json(
        { error: `You have reached the maximum limit of ${USER_LIMITS.MAX_PAGES} pages` },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate input with Zod
    const validationResult = createPageSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { title, slug, content, isPublished, qrExpiryMinutes } = validationResult.data;

    // Check if slug already exists
    const existingPage = await db.query.pages.findFirst({
      where: eq(pages.slug, slug),
    });

    if (existingPage) {
      // Optimized: Generate multiple candidates and check them all at once
      const candidates = generateSlugCandidates(USER_LIMITS.MAX_SLUG_GENERATION_ATTEMPTS);
      const existingSlugs = await db.query.pages.findMany({
        where: inArray(pages.slug, candidates),
        columns: { slug: true },
      });

      const existingSlugSet = new Set(existingSlugs.map(p => p.slug));
      const availableSlug = candidates.find(candidate => !existingSlugSet.has(candidate));

      if (!availableSlug) {
        return NextResponse.json(
          { error: 'Unable to generate unique slug. Please try again.' },
          { status: 400 }
        );
      }

      if (process.env.NODE_ENV === 'development') {
        console.log(`Slug collision detected. Generated new slug: ${availableSlug}`);
      }

      const newPage: NewPage = {
        userId: session.userId,
        title,
        slug: availableSlug,
        content: content || {},
        isPublished: isPublished ?? false,
        qrExpiryMinutes: qrExpiryMinutes ?? null,
      };

      const [createdPage] = await db.insert(pages).values(newPage).returning();
      return NextResponse.json(createdPage, { status: 201 });
    }

    const newPage: NewPage = {
      userId: session.userId,
      title,
      slug,
      content: content || {},
      isPublished: isPublished ?? false,
      qrExpiryMinutes: qrExpiryMinutes ?? null,
    };

    const [createdPage] = await db.insert(pages).values(newPage).returning();

    return NextResponse.json(createdPage, { status: 201 });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error creating page:', error);
    }
    return NextResponse.json(
      { error: 'Failed to create page' },
      { status: 500 }
    );
  }
}
