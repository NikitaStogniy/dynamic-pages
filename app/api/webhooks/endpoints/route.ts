import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/session';
import { db } from '@/lib/db';
import { webhookEndpoints } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// GET /api/webhooks/endpoints - Get all webhooks for the current user
export async function GET(request: NextRequest) {
  const session = await verifySession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const endpoints = await db
      .select()
      .from(webhookEndpoints)
      .where(eq(webhookEndpoints.userId, session.userId));

    return NextResponse.json({ endpoints });
  } catch (error) {
    console.error('Error fetching webhook endpoints:', error);
    return NextResponse.json(
      { error: 'Failed to fetch webhook endpoints' },
      { status: 500 }
    );
  }
}

// POST /api/webhooks/endpoints - Create a new webhook endpoint
export async function POST(request: NextRequest) {
  const session = await verifySession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, url, description } = body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    if (!url || typeof url !== 'string' || url.trim() === '') {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Create webhook endpoint
    const [endpoint] = await db
      .insert(webhookEndpoints)
      .values({
        userId: session.userId,
        name: name.trim(),
        url: url.trim(),
        description: description?.trim() || null,
      })
      .returning();

    return NextResponse.json({ endpoint }, { status: 201 });
  } catch (error) {
    console.error('Error creating webhook endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to create webhook endpoint' },
      { status: 500 }
    );
  }
}
