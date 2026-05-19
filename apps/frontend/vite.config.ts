import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
  resolve: {
    alias: {
      "@gym-platform/constants": fileURLToPath(
        new URL("../../packages/constants/src/index.ts", import.meta.url)
      ),
      "@gym-platform/ui": fileURLToPath(new URL("../../packages/ui/src/index.ts", import.meta.url)),
      "@gym-platform/validation": fileURLToPath(
        new URL("../../packages/validation/src/index.ts", import.meta.url)
      ),
      "@gym-platform/api-client": fileURLToPath(
        new URL("../../packages/api-client/src/index.ts", import.meta.url)
      ),
      "@gym-platform/dashboard": fileURLToPath(
        new URL("../../apps/dashboard/src/index.ts", import.meta.url)
      ),
      "@gym-platform/member-portal": fileURLToPath(
        new URL("../../apps/member-portal/src/index.ts", import.meta.url)
      ),
      "@gym-platform/website-renderer": fileURLToPath(
        new URL("../../apps/website-renderer/src/index.ts", import.meta.url)
      ),
      "node:fs": fileURLToPath(new URL("./src/shims/node-fs.ts", import.meta.url)),
      "node:path": fileURLToPath(new URL("./src/shims/node-path.ts", import.meta.url))
    }
  },
  server: {
    host: "127.0.0.1",
    port: 5173
  }
});
