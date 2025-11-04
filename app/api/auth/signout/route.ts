import { NextResponse } from 'next/server';
import { deleteSession } from '@/lib/auth';

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
    
    // Delete the session
    await deleteSession(sessionToken);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Sign out error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}