/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config, { isServer }) => {
      // Fixes npm packages that depend on `fs` module
      if (!isServer) {
        config.resolve.fallback = {
          fs: false, // This tells Webpack to resolve 'fs' to an empty module on the client side
          net: false,
          tls: false
        };
      }
      return config;
    },
  };

export default nextConfig;
