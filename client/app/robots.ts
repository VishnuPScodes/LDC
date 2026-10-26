import type { MetadataRoute } from 'next';
import { siteUrl } from './site-url';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{userAgent:'*',allow:'/',disallow:['/api/','/login','/today','/review','/progress','/history','/session/','/milestones','/feedback','/mock','/syllabus']}],
    sitemap:new URL('/sitemap.xml',siteUrl).toString(),
  };
}
