/** @type {import('next').NextConfig} */
// Force rebuild timestamp: 123456
const nextConfig = {
    output: 'standalone',
    reactStrictMode: true,
    transpilePackages: ['@repo/ui', '@repo/types'],
    serverExternalPackages: ['puppeteer-core', '@sparticuz/chromium'],
    experimental: {
        optimizePackageImports: ['@repo/ui'],
    },
    async rewrites() {
        return [
            {
                source: '/api/v1/:path*',
                destination: 'http://localhost:3001/api/v1/:path*',
            },
        ];
    },
};

module.exports = nextConfig;
