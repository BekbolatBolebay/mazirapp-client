import withPWAInit from 'next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  customWorkerDir: 'worker',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  output: 'standalone',
  async redirects() {
    return [
      {
        source: '/admin/:path*',
        destination: 'https://admin.mazirapp.kz/:path*',
        permanent: true,
      },
    ]
  },
}

export default withPWA(nextConfig)
