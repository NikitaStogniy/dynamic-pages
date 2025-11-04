import { NextResponse } from 'next/server';
import { deleteSessionCookie } from '@/lib/auth/session';

export async function POST() {
  try {
    // Delete the session cookie
    await deleteSessionCookie();

    return NextResponse.json({ success: true });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Sign out error:', error);
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
