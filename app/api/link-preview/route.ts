import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json(
      { success: 0, error: 'URL parameter is required' },
      { status: 400 }
    );
  }

  try {
    // For now, return basic metadata
    // In production, you'd fetch the actual page and parse meta tags
    const urlObj = new URL(url);
    
    return NextResponse.json({
      success: 1,
      meta: {
        title: urlObj.hostname,
        description: `Link to ${urlObj.hostname}`,
        image: {
          url: `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=256`
        }
      }
    });
  } catch (error) {
    return NextResponse.json(
      { success: 0, error: 'Invalid URL' },
      { status: 400 }
    );
  }
}