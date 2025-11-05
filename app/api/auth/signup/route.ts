import { NextResponse } from 'next/server';
import { signUpSchema } from '@/lib/auth/validation';
import { createUser, getUserByEmail } from '@/lib/auth';
import { createSessionCookie } from '@/lib/auth/session';
import { z } from 'zod';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = signUpSchema.parse(body);

    // Check if user already exists
    const existingUser = await getUserByEmail(validatedData.email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Create new user
    const user = await createUser(validatedData.email, validatedData.password);

    // Create session in httpOnly cookie
    await createSessionCookie(user.id, user.email);

    // Return user info (without session token)
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
      },
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    if (process.env.NODE_ENV === 'development') {
      console.error('Sign up error:', error);
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
