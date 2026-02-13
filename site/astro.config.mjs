import { defineConfig } from "astro/config";
import { fileURLToPath } from "node:url";
import vercel from "@astrojs/vercel/serverless";

const repoRoot = fileURLToPath(new URL("../", import.meta.url));

export default defineConfig({
  output: "server",
  adapter: vercel(),
  vite: {
    server: {
      fs: {
        allow: [repoRoot]
      }
    }
  }
});
