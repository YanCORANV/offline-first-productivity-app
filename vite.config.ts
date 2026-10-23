import fs from "node:fs";
import path from "node:path";
import { defineConfig, type Plugin } from "vite";
import vinext from "vinext";
import { nitro } from "nitro/vite";

function swStampPlugin(): Plugin {
  return {
    name: "sw-stamp-plugin",
    apply: "build",
    closeBundle() {
      const swPath = path.resolve(".output/public/sw.js");
      if (fs.existsSync(swPath)) {
        const buildId = Date.now().toString(36);
        let content = fs.readFileSync(swPath, "utf8");
        content = content.replace(
          /const BUILD_ID = [^;]+;/,
          `const BUILD_ID = "${buildId}";`,
        );
        fs.writeFileSync(swPath, content, "utf8");
      }
    },
  };
}

export default defineConfig({
  plugins: [vinext(), nitro(), swStampPlugin()],
});
