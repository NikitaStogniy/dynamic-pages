import { NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionToken } = body;
    
    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Session token is required' },
        { status: 400 }
      );
    }
    
    // Validate the session
    const sessionData = await validateSession(sessionToken);
    
    if (!sessionData) {
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 401 }
      );
    }
    
    return NextResponse.json({
      user: {
        id: sessionData.user.id,
        email: sessionData.user.email,
        emailVerified: sessionData.user.emailVerified,
      },
      session: {
        id: sessionData.session.id,
        expiresAt: sessionData.session.expiresAt,
      },
    });
  } catch (error) {
    console.error('Session validation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}