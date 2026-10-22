/** @type {import('next').NextConfig} */
// Keep the dev server's HMR chunks separate from production build output.
// Sharing `.next` lets a build invalidate chunks still requested by `next dev`.
const nextConfig = {
  output: 'standalone',
  distDir: process.env.NODE_ENV === 'development' ? '.next-dev' : '.next',
};
export default nextConfig;
