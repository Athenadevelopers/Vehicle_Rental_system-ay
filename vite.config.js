import { defineConfig } from "vite"
import { resolve } from "path"

// Get the repository name from package.json or environment variable
const getBase = () => {
  // For GitHub Pages, use the repository name as the base
  // This should be set in your GitHub Actions workflow
  if (process.env.GITHUB_REPOSITORY) {
    const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/")
    return `/${repo}/`
  }

  // Default to root for local development
  return "/"
}

export default defineConfig({
  root: ".",
  base: getBase(),
  build: {
    outDir: "dist",
    assetsDir: "assets",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        vehicles: resolve(__dirname, "vehicles.html"),
        about: resolve(__dirname, "about-us.html"),
        contact: resolve(__dirname, "contact-us.html"),
        admin: resolve(__dirname, "admin/dashboard.html"),
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./"),
    },
  },
})
