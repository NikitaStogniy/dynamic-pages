import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { db } from '@/lib/db';
import { webhookEndpoints } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Webhook trigger endpoint
 * Executes webhooks on server-side to keep tokens and credentials secure
 *
 * Rate limit: 100 requests per minute per IP
 * Timeout: 30 seconds
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Get client IP for rate limiting
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                     request.headers.get('x-real-ip') ||
                     'unknown';

    // 2. Check rate limit (100 requests per minute per IP)
    const rateLimitResult = checkRateLimit(
      `webhook:ip:${clientIp}`,
      { limit: 100, windowSeconds: 60 }
    );

    if (!rateLimitResult.success) {
      const resetInSeconds = Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000);
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          retryAfter: resetInSeconds
        },
        {
          status: 429,
          headers: {
            'Retry-After': resetInSeconds.toString(),
            'X-RateLimit-Limit': '100',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetAt.toString()
          }
        }
      );
    }

    // 3. Parse request body
    const body = await request.json();
    const { webhookId, webhookUrl, payload } = body;

    let finalWebhookUrl: string;

    // Approach 1: use webhookId to fetch URL from database
    if (webhookId !== undefined) {
      if (typeof webhookId !== 'number') {
        return NextResponse.json(
          { error: 'Invalid webhook ID' },
          { status: 400 }
        );
      }

      // Fetch webhook endpoint from database (check only if active)
      const [endpoint] = await db
        .select()
        .from(webhookEndpoints)
        .where(
          and(
            eq(webhookEndpoints.id, webhookId),
            eq(webhookEndpoints.isActive, true)
          )
        );

      if (!endpoint) {
        return NextResponse.json(
          { error: 'Webhook endpoint not found or inactive' },
          { status: 404 }
        );
      }

      finalWebhookUrl = endpoint.url;
    }
    // Approach 2: use webhookUrl directly
    else if (webhookUrl && typeof webhookUrl === 'string') {
      finalWebhookUrl = webhookUrl;
    }
    else {
      return NextResponse.json(
        { error: 'Either webhookId or webhookUrl must be provided' },
        { status: 400 }
      );
    }

    // 4. Validate URL format
    let url: URL;
    try {
      url = new URL(finalWebhookUrl);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // 5. Only allow http/https protocols
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return NextResponse.json(
        { error: 'Only HTTP/HTTPS protocols are allowed' },
        { status: 400 }
      );
    }

    // 6. Execute webhook with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const webhookResponse = await fetch(finalWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'DynamicPages-Webhook/1.0'
        },
        body: JSON.stringify(payload || {}),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Get response body (limit to 1MB to prevent memory issues)
      const responseText = await webhookResponse.text();
      const truncatedResponse = responseText.length > 1000000
        ? responseText.substring(0, 1000000) + '... (truncated)'
        : responseText;

      // Return webhook response
      return NextResponse.json(
        {
          success: true,
          status: webhookResponse.status,
          statusText: webhookResponse.statusText,
          response: truncatedResponse,
          headers: Object.fromEntries(webhookResponse.headers.entries())
        },
        {
          status: 200,
          headers: {
            'X-RateLimit-Limit': '100',
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.resetAt.toString()
          }
        }
      );

    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        return NextResponse.json(
          {
            success: false,
            error: 'Webhook request timeout (30 seconds exceeded)'
          },
          { status: 504 }
        );
      }

      // Network or other errors
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to execute webhook',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 502 }
      );
    }

  } catch (error) {
    console.error('Webhook trigger error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
