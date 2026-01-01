import { defineConfig } from "astro/config";
import { fileURLToPath } from "node:url";

const repoRoot = fileURLToPath(new URL("../", import.meta.url));

export default defineConfig({
  output: "static",
  vite: {
    server: {
      fs: {
        allow: [repoRoot]
      }
    }
  }
});
