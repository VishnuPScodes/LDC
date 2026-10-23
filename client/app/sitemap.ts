import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

export default function sitemap(): MetadataRoute.Sitemap {
  const requestHeaders = headers();
  const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL;
  const forwardedHost = requestHeaders.get('x-forwarded-host');
  const host = forwardedHost?.split(',')[0]?.trim() || requestHeaders.get('host');
  const forwardedProtocol = requestHeaders.get('x-forwarded-proto')?.split(',')[0]?.trim();
  const protocol = forwardedProtocol || (process.env.NODE_ENV === 'development' ? 'http' : 'https');
  const origin = configuredOrigin || (host ? `${protocol}://${host}` : 'http://localhost:3001');

  return [{ url: new URL('/', origin).toString(), changeFrequency: 'weekly', priority: 1 }];
}
