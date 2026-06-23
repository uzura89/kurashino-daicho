/** @type {import('next').NextConfig} */
const nextConfig = {
  // §1, §2: 静的エクスポート。サーバー実行経路・API Routes を持たない。
  output: 'export',
  reactStrictMode: true,
  trailingSlash: true,
  images: { unoptimized: true },
};

module.exports = nextConfig;
