import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./test-e2e",
  timeout: 60000,
  fullyParallel: false,
  reporter: "list",
  use: {
    headless: true,
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
  },
});
