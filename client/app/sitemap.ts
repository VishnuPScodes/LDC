import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import { siteUrl } from './site-url';

export const dynamic = 'force-dynamic';

export default function sitemap(): MetadataRoute.Sitemap {
  const requestHeaders = headers();
  const configuredOrigin = siteUrl;
  const forwardedHost = requestHeaders.get('x-forwarded-host');
  const host = forwardedHost?.split(',')[0]?.trim() || requestHeaders.get('host');
  const forwardedProtocol = requestHeaders.get('x-forwarded-proto')?.split(',')[0]?.trim();
  const protocol = forwardedProtocol || (process.env.NODE_ENV === 'development' ? 'http' : 'https');
  const origin = configuredOrigin || (host ? `${protocol}://${host}` : 'http://localhost:3001');

  return [{ url: new URL('/', origin).toString(), lastModified: new Date(), changeFrequency: 'weekly', priority: 1 }];
}
