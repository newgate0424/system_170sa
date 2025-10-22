/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // ปิด static export เพราะใช้ cookies และ authentication
  // output: 'standalone', // ปิดไว้ในโหมด development
  images: {
    domains: [],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
}

module.exports = nextConfig
