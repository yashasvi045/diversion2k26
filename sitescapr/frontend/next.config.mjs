/** @type {import('next').NextConfig} */
const nextConfig = {
  // Transpile react-leaflet and leaflet for Next.js compatibility
  transpilePackages: ["react-leaflet", "leaflet"],
};

export default nextConfig;
