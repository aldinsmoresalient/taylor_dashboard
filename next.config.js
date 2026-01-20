/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@clickhouse/client'],
  },
}

module.exports = nextConfig

