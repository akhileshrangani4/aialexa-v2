/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    qualities: [75, 90, 95, 100],
  },
  // Externalize pdf-parse to avoid bundling issues
  // pdf-parse uses Node.js-specific modules that can't be bundled by webpack
  serverExternalPackages: ["pdf-parse"],
  output: "standalone",
};

export default nextConfig;
