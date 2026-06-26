/**
 * Copie data/data.json dans web/dist/data.json.
 * À lancer après npm run build ou npm run update
 * pour que le site IIS serve les données fraîches.
 */
import { copyFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const src  = join(__dirname, "../../data/data.json");
const dest = join(__dirname, "../../web/dist/data.json");

if (!existsSync(src)) {
  console.error("data/data.json introuvable. Lancez d'abord : npm run backfill");
  process.exit(1);
}

if (!existsSync(join(__dirname, "../../web/dist"))) {
  console.error("web/dist/ introuvable. Lancez d'abord : npm run build:local");
  process.exit(1);
}

copyFileSync(src, dest);
console.log(`✓ data.json synchronisé dans web/dist/`);
