/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    MONGO_URI: process.env.MONGO_URI,
    VOYAGE_API_KEY: process.env.VOYAGE_API_KEY,
  },
};

export default nextConfig;

