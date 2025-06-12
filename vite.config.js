import { defineConfig } from "vite"

export default defineConfig({
  root: ".",
  build: {
    outDir: "dist",
    assetsDir: "assets",
    rollupOptions: {
      input: {
        main: "./index.html",
        admin: "./admin/dashboard.html",
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
})
