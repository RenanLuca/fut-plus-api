import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    setupFiles: ["./vitest.setup.ts"],
  },
  resolve: {
    alias: [
      {
        find: /^@src\/(.*)/,
        replacement: path.resolve(__dirname, "./src/$1"),
      },
    ],
  },
});
