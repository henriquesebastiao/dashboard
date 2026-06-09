import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import yaml from "@rollup/plugin-yaml";

export default defineConfig({
  plugins: [react(), yaml()],
  server: {
    host: true,
    port: 5173,
  },
});
