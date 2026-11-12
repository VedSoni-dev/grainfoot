// Copies the drop-in component into public/ so the /app playground can offer it as a copy-paste file.
import { copyFileSync, mkdirSync } from "node:fs";
mkdirSync("public/grainfoot", { recursive: true });
copyFileSync("components/GrainFooter.tsx", "public/grainfoot/GrainFooter.tsx");
