import { defineConfig } from "vite";
import { resolve } from "node:path";
import dts from "vite-plugin-dts";

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: resolve(import.meta.dirname, "src/index.ts"),
        "data/index": resolve(import.meta.dirname, "src/data/index.ts")
      },
      formats: ["es", "cjs"],
      fileName: (format, entryName) => `${entryName}.${format === "es" ? "js" : "cjs"}`
    },
    rollupOptions: {
      output: {
        exports: "named"
      }
    },
    sourcemap: true,
    minify: false
  },
  plugins: [
    dts({
      include: ["src/**/*.ts"],
      entryRoot: "src",
      outDir: "dist"
    })
  ]
});
