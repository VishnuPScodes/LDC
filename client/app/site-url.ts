const configuredSiteUrl=process.env.NEXT_PUBLIC_SITE_URL||'https://free-psc.vercel.app';
export const siteUrl=new URL(configuredSiteUrl.includes('://')?configuredSiteUrl:`https://${configuredSiteUrl}`).origin;

