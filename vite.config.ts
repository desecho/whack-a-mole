import { defineConfig } from "vitest/config";

export default defineConfig({
  base: "/games/whack-a-mole/",
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"]
  }
});
