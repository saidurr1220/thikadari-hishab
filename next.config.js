  reactStrictMode: true,
  swcMinify: true,
}

module.exports = nextConfig
/** @type {import('next').NextConfig} */
const nextConfig = {
<<<<<<< HEAD
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

module.exports = nextConfig;
=======
  reactStrictMode: true,
  swcMinify: true,
}

module.exports = nextConfig
>>>>>>> master
