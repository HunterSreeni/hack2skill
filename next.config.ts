import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // same-origin-allow-popups (not the stricter same-origin default)
        // so Firebase Auth's signInWithPopup can talk to its own OAuth
        // popup window - without this, sign-in still works but logs a
        // benign "Cross-Origin-Opener-Policy would block window.closed"
        // warning on every attempt.
        source: "/:path*",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
