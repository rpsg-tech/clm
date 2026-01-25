/** @type {import('next').NextConfig} */
// Force rebuild timestamp: 123456
const nextConfig = {
    reactStrictMode: true,
    transpilePackages: ['@repo/ui', '@repo/types'],
    experimental: {
        optimizePackageImports: ['@repo/ui'],
    },
};

module.exports = nextConfig;
