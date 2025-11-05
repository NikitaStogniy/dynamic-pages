import { NextRequest, NextResponse } from 'next/server';
import { uploadFile, UploadcareFile as UCFile } from '@uploadcare/upload-client';
import { db } from '@/lib/db';
import { uploadcareFiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { UPLOAD_CONFIG } from '@/lib/constants';
import { verifySession } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  try {
    // Check authentication via httpOnly cookie
    const session = await verifySession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the file from form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file size
    if (file.size > UPLOAD_CONFIG.MAX_SIZE) {
      return NextResponse.json({
        error: `File too large. Maximum size is ${UPLOAD_CONFIG.MAX_SIZE / 1024 / 1024}MB`
      }, { status: 400 });
    }

    // Validate file type (images only)
    if (!(UPLOAD_CONFIG.ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only images are allowed' }, { status: 400 });
    }

    // Check if Uploadcare keys are configured
    const publicKey = process.env.UPLOADCARE_PUBLIC_KEY;
    if (!publicKey) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Uploadcare public key not configured');
      }
      return NextResponse.json({ error: 'Upload service not configured' }, { status: 500 });
    }

    // Convert File to Buffer for Uploadcare
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Uploadcare
    const result = await uploadFile(buffer, {
      publicKey,
      fileName: file.name,
      contentType: file.type,
      metadata: {
        userId: session.userId.toString(),
        uploadedAt: new Date().toISOString(),
      },
    }) as UCFile;

    // Save file metadata to database
    const [savedFile] = await db
      .insert(uploadcareFiles)
      .values({
        fileId: result.uuid!,
        fileUrl: result.cdnUrl || `https://ucarecdn.com/${result.uuid}/`,
        userId: session.userId,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
      })
      .returning();

    return NextResponse.json({
      success: 1,
      file: {
        url: savedFile.fileUrl,
        id: savedFile.fileId,
        name: savedFile.fileName,
        size: savedFile.fileSize,
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Upload error:', error);
    }
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

// GET endpoint to list user's uploaded files
export async function GET(request: NextRequest) {
  try {
    // Check authentication via httpOnly cookie
    const session = await verifySession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's files
    const files = await db
      .select()
      .from(uploadcareFiles)
      .where(eq(uploadcareFiles.userId, session.userId))
      .orderBy(uploadcareFiles.createdAt);

    return NextResponse.json({ files });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching files:', error);
    }
    return NextResponse.json(
      { error: 'Failed to fetch files' },
      { status: 500 }
    );
  }
}