import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/session';

export async function GET() {
  try {
    // Verify session from httpOnly cookie
    const session = await verifySession();

    if (!session) {
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      user: {
        id: session.userId,
        email: session.email,
      },
      expiresAt: session.expiresAt,
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Session validation error:', error);
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
