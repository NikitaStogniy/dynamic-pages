import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

/**
 * SSRF Protection: Check if hostname is a private IP or localhost
 */
function isPrivateIP(hostname: string): boolean {
  // Localhost patterns
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
    return true;
  }

  // Private IP ranges
  const privateRanges = [
    /^10\./,                    // 10.0.0.0/8
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12
    /^192\.168\./,              // 192.168.0.0/16
    /^169\.254\./,              // 169.254.0.0/16 (link-local)
    /^fc00:/,                   // fc00::/7 (IPv6 ULA)
    /^fe80:/,                   // fe80::/10 (IPv6 link-local)
  ];

  return privateRanges.some(pattern => pattern.test(hostname));
}

/**
 * Extract Open Graph and Twitter Card meta tags from HTML
 */
function extractMetaTags(html: string, url: string) {
  const $ = cheerio.load(html);
  const urlObj = new URL(url);

  // Extract Open Graph tags
  const ogTitle = $('meta[property="og:title"]').attr('content');
  const ogDescription = $('meta[property="og:description"]').attr('content');
  const ogImage = $('meta[property="og:image"]').attr('content');
  const ogType = $('meta[property="og:type"]').attr('content');
  const ogSiteName = $('meta[property="og:site_name"]').attr('content');

  // Extract Twitter Card tags (fallback)
  const twitterTitle = $('meta[name="twitter:title"]').attr('content');
  const twitterDescription = $('meta[name="twitter:description"]').attr('content');
  const twitterImage = $('meta[name="twitter:image"]').attr('content');

  // Extract standard meta tags (fallback)
  const metaDescription = $('meta[name="description"]').attr('content');

  // Extract title
  const htmlTitle = $('title').text();

  // Build result with fallbacks
  const title = ogTitle || twitterTitle || htmlTitle || urlObj.hostname;
  const description = ogDescription || twitterDescription || metaDescription || `Link to ${urlObj.hostname}`;

  // Handle relative image URLs
  let imageUrl = ogImage || twitterImage;
  if (imageUrl && !imageUrl.startsWith('http')) {
    try {
      imageUrl = new URL(imageUrl, url).href;
    } catch {
      // If URL construction fails, use favicon
      imageUrl = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=256`;
    }
  }

  return {
    title,
    description,
    image: {
      url: imageUrl || `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=256`
    },
    siteName: ogSiteName,
    type: ogType
  };
}

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
    // Validate URL format
    const urlObj = new URL(url);

    // Only allow http/https protocols
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      return NextResponse.json(
        { success: 0, error: 'Only HTTP/HTTPS protocols are allowed' },
        { status: 400 }
      );
    }

    // SSRF Protection: Block private IPs
    if (isPrivateIP(urlObj.hostname)) {
      return NextResponse.json(
        { success: 0, error: 'Cannot fetch from private IP addresses or localhost' },
        { status: 400 }
      );
    }

    // Fetch the page with timeout (10 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; DynamicPages-LinkPreview/1.0; +https://dynamicpages.app/bot)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        signal: controller.signal,
        redirect: 'follow',
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Check content type
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('text/html')) {
        // Return basic metadata for non-HTML content
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
      }

      // Parse HTML (limit to 1MB to prevent memory issues)
      const text = await response.text();
      const truncatedHtml = text.length > 1000000 ? text.substring(0, 1000000) : text;

      // Extract meta tags
      const meta = extractMetaTags(truncatedHtml, url);

      return NextResponse.json({
        success: 1,
        meta
      });

    } catch (fetchError) {
      clearTimeout(timeoutId);

      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        return NextResponse.json(
          { success: 0, error: 'Request timeout (10 seconds exceeded)' },
          { status: 504 }
        );
      }

      // Return fallback metadata on fetch error
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
    }

  } catch {
    return NextResponse.json(
      { success: 0, error: 'Invalid URL' },
      { status: 400 }
    );
  }
}