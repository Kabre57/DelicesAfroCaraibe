/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Ajoutez ces options
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Optionnel : désactivez certaines optimisations problématiques
  experimental: {
    optimizeCss: false,
  },
  // Configuration Turbopack pour éviter les erreurs de caractères non-ASCII
  turbopack: {
    root: process.cwd(),
  }
}

export default nextConfig