/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }

    // Add alias for @ path
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, './src'),
    };

    // Ignore specific warnings
    config.ignoreWarnings = [
      { module: /node_modules\/formidable/ },
      { module: /node_modules\/multer/ },
    ];

    return config;
  },
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },
  // App Router용 파일 업로드 설정
  experimental: {
    serverActions: {
      bodySizeLimit: '500mb', // 원래 의도대로 500MB 설정
      allowedOrigins: [
        'localhost:3000',
        '*.vercel.app',
        ...(process.env.VERCEL_URL ? [process.env.VERCEL_URL] : [])
      ],
    },
  },
};

const path = require('path');

module.exports = nextConfig;