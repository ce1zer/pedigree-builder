import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  serverExternalPackages: ['@supabase/supabase-js'],
  turbopack: {
    // We have multiple lockfiles in the repo; pin Turbopack’s root to the Next app directory
    // so dev server resolution + file watching behave consistently.
    root: path.join(__dirname),
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.in',
      },
    ],
  },
};

export default nextConfig;