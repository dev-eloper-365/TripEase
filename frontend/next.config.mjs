/** @type {import('next').NextConfig} */
const nextConfig = {};

export default nextConfig;
/** @type {import('next').NextConfig} */
const nextConfig = {
    async headers() {
      return [
        {
          source: "/(.*)", // Apply to all routes
          headers: [
            {
              key: "X-Frame-Options",
              value: "ALLOWALL" // Allow embedding in iframes
            },
            {
              key: "Content-Security-Policy",
              value: "frame-ancestors *" // No iframe restrictions
            }
          ]
        }
      ];
    }
  };
  
  export default nextConfig;
  
