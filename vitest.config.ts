import { defineConfig } from "vitest/config";
import path from "node:path";

// Pin the timezone so date-string parsing (new Date("YYYY-MM-DD") is UTC,
// but getMonth()/getDate() read local time) is deterministic across machines.
process.env.TZ = "UTC";

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["node_modules", ".next"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
