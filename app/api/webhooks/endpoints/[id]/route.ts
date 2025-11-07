import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/session';
import { db } from '@/lib/db';
import { webhookEndpoints } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// GET /api/webhooks/endpoints/[id] - Get specific webhook endpoint
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await verifySession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const [endpoint] = await db
      .select()
      .from(webhookEndpoints)
      .where(
        and(
          eq(webhookEndpoints.id, id),
          eq(webhookEndpoints.userId, session.userId)
        )
      );

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Webhook endpoint not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ endpoint });
  } catch (error) {
    console.error('Error fetching webhook endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to fetch webhook endpoint' },
      { status: 500 }
    );
  }
}

// PUT /api/webhooks/endpoints/[id] - Update webhook endpoint
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await verifySession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const body = await request.json();
    const { name, url, description, isActive } = body;

    // Check ownership
    const [existing] = await db
      .select()
      .from(webhookEndpoints)
      .where(
        and(
          eq(webhookEndpoints.id, id),
          eq(webhookEndpoints.userId, session.userId)
        )
      );

    if (!existing) {
      return NextResponse.json(
        { error: 'Webhook endpoint not found' },
        { status: 404 }
      );
    }

    // Validate fields if provided
    if (name !== undefined && (typeof name !== 'string' || name.trim() === '')) {
      return NextResponse.json(
        { error: 'Name must be a non-empty string' },
        { status: 400 }
      );
    }

    if (url !== undefined) {
      if (typeof url !== 'string' || url.trim() === '') {
        return NextResponse.json(
          { error: 'URL must be a non-empty string' },
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
    }

    // Update only provided fields
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updateData.name = name.trim();
    if (url !== undefined) updateData.url = url.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    const [updated] = await db
      .update(webhookEndpoints)
      .set(updateData)
      .where(
        and(
          eq(webhookEndpoints.id, id),
          eq(webhookEndpoints.userId, session.userId)
        )
      )
      .returning();

    return NextResponse.json({ endpoint: updated });
  } catch (error) {
    console.error('Error updating webhook endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to update webhook endpoint' },
      { status: 500 }
    );
  }
}

// DELETE /api/webhooks/endpoints/[id] - Delete webhook endpoint
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await verifySession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    // Delete only if owned by user
    const [deleted] = await db
      .delete(webhookEndpoints)
      .where(
        and(
          eq(webhookEndpoints.id, id),
          eq(webhookEndpoints.userId, session.userId)
        )
      )
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { error: 'Webhook endpoint not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting webhook endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to delete webhook endpoint' },
      { status: 500 }
    );
  }
}
