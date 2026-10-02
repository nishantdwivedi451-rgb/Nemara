// Copies the MediaPipe Tasks Vision WASM runtime into /public so the
// try-on prototype can self-host it (no third-party script CDN at runtime).
import { cpSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const src = join(process.cwd(), "node_modules/@mediapipe/tasks-vision/wasm");
const dest = join(process.cwd(), "public/mediapipe/wasm");
if (!existsSync(src)) {
  console.warn("[copy-mediapipe] tasks-vision not installed; try-on will use manual placement.");
  process.exit(0);
}
mkdirSync(dest, { recursive: true });
for (const f of ["vision_wasm_internal.js", "vision_wasm_internal.wasm", "vision_wasm_nosimd_internal.js", "vision_wasm_nosimd_internal.wasm"]) {
  cpSync(join(src, f), join(dest, f));
}
console.log("[copy-mediapipe] WASM runtime copied to public/mediapipe/wasm");
