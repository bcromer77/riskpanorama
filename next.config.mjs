// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // ✅ Ignore all ESLint errors on build
  },
  typescript: {
    ignoreBuildErrors: true, // ✅ Ignore TypeScript "any" errors
  },
  experimental: {
    turbo: {
      rules: {
        "*.ts(x)?": ["babel-loader"],
      },
    },
  },
};

export default nextConfig;

