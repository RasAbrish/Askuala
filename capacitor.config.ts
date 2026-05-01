import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.askuala.app",
  appName: "Askuala",
  webDir: "public",
  server: {
    // For local Android emulator testing with `npm run dev`.
    // Override with CAPACITOR_SERVER_URL in CI/release builds.
    url: process.env.CAPACITOR_SERVER_URL || "http://10.0.2.2:3000",
    cleartext: true,
  },
};

export default config;
