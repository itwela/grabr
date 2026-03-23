

const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "*.cdninstagram.com" },
      { protocol: "https", hostname: "*.tiktokcdn.com" },
      { protocol: "https", hostname: "pbs.twimg.com" },
    ],
  },
};

export default nextConfig;
