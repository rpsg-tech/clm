/** @type {import('next').NextConfig} */
// Force rebuild timestamp: 123456
const nextConfig = {
    output: 'standalone',
    reactStrictMode: true,
    transpilePackages: ['@repo/ui', '@repo/types'],
    experimental: {
        optimizePackageImports: ['@repo/ui'],
        serverComponentsExternalPackages: ['puppeteer-core', '@sparticuz/chromium'],
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
