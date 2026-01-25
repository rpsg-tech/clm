/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    transpilePackages: ['@repo/ui', '@repo/types'],
    experimental: {
        optimizePackageImports: ['@repo/ui'],
    },
};

module.exports = nextConfig;
