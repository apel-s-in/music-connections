/** @type {import('next').NextConfig} */
const isCI = process.env.GITHUB_ACTIONS === 'true';
const repoBase = '/music-connections';

const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  basePath: isCI ? repoBase : '',
  assetPrefix: isCI ? repoBase + '/' : '',
  // Чтобы роуты App Router корректно экспортировались
  experimental: {
    typedRoutes: true
  }
};

module.exports = nextConfig;
