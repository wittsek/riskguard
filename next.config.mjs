/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output only for the Community Docker image (DOCKER=1 at build).
  ...(process.env.DOCKER === '1' ? { output: 'standalone' } : {}),
};

export default nextConfig;
