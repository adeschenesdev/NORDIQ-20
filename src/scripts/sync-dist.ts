/**
 * Copie data/data.json dans web/dist/data.json.
 * À lancer après npm run build ou npm run update
 * pour que le site IIS serve les données fraîches.
 */
import { copyFileSync, existsSync } from "fs";
import { join, dirname, basename } from "path";
import { fileURLToPath } from "url";
import { dataPathFor } from "../data/store.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
const nameIdx = args.indexOf("--name");
const nameArg = nameIdx >= 0 ? args[nameIdx + 1] : undefined;

const src = dataPathFor(nameArg);
const fileName = basename(src);
const dest = join(__dirname, "../../web/dist", fileName);

if (!existsSync(src)) {
  console.error(`${src} introuvable. Lancez d'abord : npm run backfill`);
  process.exit(1);
}

if (!existsSync(join(__dirname, "../../web/dist"))) {
  console.error("web/dist/ introuvable. Lancez d'abord : npm run build:local");
  process.exit(1);
}

copyFileSync(src, dest);
console.log(`✓ ${fileName} synchronisé dans web/dist/`);
