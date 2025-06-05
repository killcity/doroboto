/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker
  output: 'standalone',
  
  // Experimental features for better performance
  experimental: {
    // Enable server components
    serverComponentsExternalPackages: [],
  },
  
  // Optimize for production
  swcMinify: true,
  
  // Enable compression
  compress: true,
  
  // Configure images for multi-platform support
  images: {
    unoptimized: true, // Disable image optimization for Docker
  },
  
  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001',
  },
};

module.exports = nextConfig; 