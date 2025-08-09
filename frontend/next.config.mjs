// next.config.mjs
export default {
  async headers() {
    return [
      {
        source: "/(.*)", // Apply to all routes
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors *;"
          }
        ]
      }
    ];
  }
};
