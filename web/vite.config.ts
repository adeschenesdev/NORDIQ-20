import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve, join } from "path";
import { createReadStream, existsSync } from "fs";

const DATA_FILE = resolve(__dirname, "../data/data.json");

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "serve-data-json",
      configureServer(server) {
        server.middlewares.use("/data.json", (_req, res) => {
          if (!existsSync(DATA_FILE)) {
            res.writeHead(404, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "data.json not found" }));
            return;
          }
          res.setHeader("Content-Type", "application/json");
          createReadStream(DATA_FILE).pipe(res);
        });
      },
    },
  ],
  base: "./",
  server: {
    port: process.env.PORT ? parseInt(process.env.PORT) : 5173,
    fs: {
      allow: [join(__dirname, "..")],
    },
  },
});
