import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import { siteUrl } from './site-url';

export const dynamic = 'force-dynamic';

export default function robots(): MetadataRoute.Robots {
  const requestHeaders = headers();
  const forwardedHost = requestHeaders.get('x-forwarded-host');
  const host = forwardedHost?.split(',')[0]?.trim() || requestHeaders.get('host');
  const forwardedProtocol = requestHeaders.get('x-forwarded-proto')?.split(',')[0]?.trim();
  const protocol = forwardedProtocol || (process.env.NODE_ENV === 'development' ? 'http' : 'https');
  const origin = siteUrl || (host ? `${protocol}://${host}` : 'http://localhost:3001');

  return {
    rules: [{ userAgent: '*', allow: '/' }],
    sitemap: new URL('/sitemap.xml', origin).toString(),
  };
}
