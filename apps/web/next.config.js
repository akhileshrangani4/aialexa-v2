/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    qualities: [75, 90, 95, 100],
  },
  experimental: {
    // Increase body size limit to handle large file uploads
    // Base64 encoding increases file size by ~33%, so 50MB file becomes ~66.5MB
    // Set to 75MB to account for JSON wrapper overhead
    middlewareClientMaxBodySize: "75mb",
  },
  // Externalize pdf-parse to avoid bundling issues
  // pdf-parse uses Node.js-specific modules that can't be bundled by webpack
  serverExternalPackages: ["pdf-parse"],
};

export default nextConfig;
