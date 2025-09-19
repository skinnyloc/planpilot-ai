/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Disable type checking during build for faster deployment
    ignoreBuildErrors: true,
  },
  eslint: {
    // Disable ESLint during build for faster deployment
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['example.com'], // Add domains for external images if needed
  },
  env: {
    // Make environment variables available to the client
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  },
  poweredByHeader: false,
  reactStrictMode: true,
}

module.exports = nextConfig