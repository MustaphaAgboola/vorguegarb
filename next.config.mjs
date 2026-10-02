/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Supabase Storage (product photos uploaded there)
      { protocol: "https", hostname: "**.supabase.co" },
      // Google account avatars
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      // Handy for placeholder imagery during development
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;
