import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
    globals: true,
    testTimeout: 60000,
    hookTimeout: 60000,
    server: {
      deps: {
        inline: ["next-auth"],
      },
    },
    alias: {
      "@": path.resolve("./src"),
      "next/server": path.resolve("./node_modules/next/server.js"),
    },
  },
});
