import { defineConfig } from "vite";
import { sites } from "@openai/sites-vite-plugin";
import { cpSync, mkdirSync } from "node:fs";

const workerOutput = {
  name: "referredby-worker-output",
  closeBundle() {
    mkdirSync("dist/server", { recursive: true });
    cpSync("worker.js", "dist/server/index.js");
  }
};
export default defineConfig({
  plugins: [sites(), workerOutput],
  build: { rollupOptions: { input: { home: "index.html", faq: "faq.html", privacy: "privacy.html", terms: "terms.html" } } }
});
