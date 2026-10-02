// Self-hosts the MediaPipe Tasks Vision runtime (WASM) and, when reachable, the
// face & hand landmark models, so the try-on works without third-party CDNs.
import { cpSync, existsSync, mkdirSync, writeFileSync, statSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const src = join(root, "node_modules/@mediapipe/tasks-vision/wasm");
const dest = join(root, "public/mediapipe/wasm");
if (existsSync(src)) {
  mkdirSync(dest, { recursive: true });
  for (const f of ["vision_wasm_internal.js", "vision_wasm_internal.wasm", "vision_wasm_nosimd_internal.js", "vision_wasm_nosimd_internal.wasm"]) cpSync(join(src, f), join(dest, f));
  console.log("[mediapipe] WASM runtime copied");
} else console.warn("[mediapipe] tasks-vision not installed; try-on falls back to manual placement");

const models = {
  "face_landmarker.task": "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
  "hand_landmarker.task": "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
};
const mdir = join(root, "public/mediapipe/models");
mkdirSync(mdir, { recursive: true });
for (const [name, url] of Object.entries(models)) {
  const out = join(mdir, name);
  if (existsSync(out) && statSync(out).size > 100_000) continue;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(String(res.status));
    writeFileSync(out, Buffer.from(await res.arrayBuffer()));
    console.log(`[mediapipe] model ${name} downloaded`);
  } catch (e) {
    console.warn(`[mediapipe] could not download ${name} (${e.message}); the browser will load it from Google's CDN`);
  }
}
