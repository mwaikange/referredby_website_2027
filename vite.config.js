import { defineConfig } from "vite";
import { sites } from "@openai/sites-vite-plugin";
export default defineConfig({
  plugins: [sites()],
  build: { rollupOptions: { input: { home: "index.html", faq: "faq.html", privacy: "privacy.html", terms: "terms.html" } } }
});
