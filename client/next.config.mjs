/** @type {import('next').NextConfig} */
// Keep the dev server's HMR chunks separate from production build output.
// Sharing `.next` lets a build invalidate chunks still requested by `next dev`.
const nextConfig = {
  output: 'standalone',
  distDir: process.env.NODE_ENV === 'development' ? '.next-dev' : '.next',
  async rewrites() {
    const configuredBackend = process.env.BACKEND_API_URL
      || process.env.NEXT_PUBLIC_API_URL
      || (process.env.NODE_ENV === 'development' ? 'http://localhost:4000' : 'https://ldc-2vk9-ashen.vercel.app');
    const backendOrigin = configuredBackend.replace(/\/+$/, '').replace(/\/api$/i, '');
    return [{ source: '/api/:path*', destination: `${backendOrigin}/api/:path*` }];
  },
};
export default nextConfig;
