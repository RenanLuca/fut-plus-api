import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^@src\/(.*)/,
        replacement: path.resolve(__dirname, "./src/$1"),
      },
    ],
  },
});
