/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' }, // posters/bannières peuvent venir de n'importe quelle source pour l'instant
    ],
  },
};

module.exports = nextConfig;
