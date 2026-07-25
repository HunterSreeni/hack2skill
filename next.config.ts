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
          // Stop browsers from MIME-sniffing a response into something executable.
          { key: "X-Content-Type-Options", value: "nosniff" },
          // The crisis button and the pairing code must never be clickjackable
          // into a hidden frame on someone else's page.
          { key: "X-Frame-Options", value: "DENY" },
          // Recovery is sensitive: never leak the path a person was on to
          // third-party origins, only the bare origin.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Microphone stays enabled for the same-origin distress listener;
          // everything else the app never uses is switched off outright.
          {
            key: "Permissions-Policy",
            value: "camera=(), geolocation=(), payment=(), usb=(), microphone=(self)",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
