/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    // Webpackキャッシュの問題を修正
    if (config.cache && typeof config.cache === 'object') {
      config.cache = {
        ...config.cache,
        compression: false,
      };
    }
    return config;
  },
}

export default nextConfig
