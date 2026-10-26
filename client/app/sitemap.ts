import type { MetadataRoute } from 'next';
import { siteUrl } from './site-url';
import {publicPapers,publicTopics,publicYears,questionDataLastModified,syllabusDataLastModified,topicPageCount} from './public-content';

export default function sitemap(): MetadataRoute.Sitemap {
  const urls:MetadataRoute.Sitemap=[
    {url:new URL('/',siteUrl).toString(),lastModified:questionDataLastModified,changeFrequency:'weekly',priority:1},
    ...['/papers','/years','/topics'].map(path=>({url:new URL(path,siteUrl).toString(),lastModified:questionDataLastModified,changeFrequency:'weekly' as const,priority:.8})),
    {url:new URL('/ldc-syllabus',siteUrl).toString(),lastModified:syllabusDataLastModified,changeFrequency:'yearly',priority:.8},
    ...publicPapers.map(paper=>({url:new URL(`/papers/${paper.slug}`,siteUrl).toString(),lastModified:questionDataLastModified,changeFrequency:'yearly' as const,priority:.7})),
    ...publicYears.map(year=>({url:new URL(`/years/${year}`,siteUrl).toString(),lastModified:questionDataLastModified,changeFrequency:'yearly' as const,priority:.6})),
    ...publicTopics.flatMap(topic=>[
      {url:new URL(`/topics/${topic.slug}`,siteUrl).toString(),lastModified:questionDataLastModified,changeFrequency:'weekly' as const,priority:.7},
      ...Array.from({length:Math.max(0,topicPageCount(topic)-1)},(_,index)=>({url:new URL(`/topics/${topic.slug}/page/${index+2}`,siteUrl).toString(),lastModified:questionDataLastModified,changeFrequency:'yearly' as const,priority:.5}))
    ])
  ];
  return urls;
}
