import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve, join } from "path";
import { createReadStream, existsSync } from "fs";

const DATA_DIR = resolve(__dirname, "../data");
// N'autorise que les fichiers data*.json (ex. data.json, data-backtest.json)
const DATA_FILE_RE = /^\/(data(?:-[a-z0-9-]+)?\.json)$/i;

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "serve-data-json",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const path = (req.url ?? "").split("?")[0];
          const match = DATA_FILE_RE.exec(path);
          if (!match) return next();

          const file = resolve(DATA_DIR, match[1]);
          if (!existsSync(file)) {
            res.writeHead(404, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: `${match[1]} not found` }));
            return;
          }
          res.setHeader("Content-Type", "application/json");
          createReadStream(file).pipe(res);
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
