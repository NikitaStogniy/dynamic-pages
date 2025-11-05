import { NextResponse } from 'next/server';
import { signInSchema } from '@/lib/auth/validation';
import { getUserByEmail, verifyPassword } from '@/lib/auth';
import { createSessionCookie } from '@/lib/auth/session';
import { z } from 'zod';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = signInSchema.parse(body);

    // Find user by email
    const user = await getUserByEmail(validatedData.email);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await verifyPassword(validatedData.password, user.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Create session in httpOnly cookie
    await createSessionCookie(user.id, user.email);

    // Return user info (without session token)
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    if (process.env.NODE_ENV === 'development') {
      console.error('Sign in error:', error);
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
