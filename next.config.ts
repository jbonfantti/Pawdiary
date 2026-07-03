import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Diary photo uploads go through a server action; phone photos routinely
      // exceed the 1MB default. Keep in sync with MAX_PHOTO_BYTES in actions.ts.
      bodySizeLimit: "16mb",
    },
  },
};

export default nextConfig;
