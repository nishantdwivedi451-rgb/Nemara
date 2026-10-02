"use client";
import type { TryOnAnchor } from "@/lib/commerce/types";
import type { AnchorPoint, Tracker, TryOnProvider } from "./types";

const MODEL_BASE = process.env.NEXT_PUBLIC_TRYON_MODEL_BASE || "https://storage.googleapis.com/mediapipe-models";
const WASM = "/mediapipe/wasm";

type P = { x: number; y: number };

/** Prototype provider: on-device face & hand tracking with MediaPipe Tasks Vision (no images leave the device). */
export const mediapipeProvider: TryOnProvider = {
  id: "mediapipe",
  label: "On-device prototype",
  async createTracker(anchor: TryOnAnchor): Promise<Tracker> {
    const vision = await import("@mediapipe/tasks-vision");
    const fileset = await vision.FilesetResolver.forVisionTasks(WASM);
    const make = async (delegate: "GPU" | "CPU") => anchor === "wrist"
      ? vision.HandLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: `${MODEL_BASE}/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`, delegate },
          runningMode: "VIDEO", numHands: 1,
        })
      : vision.FaceLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: `${MODEL_BASE}/face_landmarker/face_landmarker/float16/1/face_landmarker.task`, delegate },
          runningMode: "VIDEO", numFaces: 1,
        });
    let lm: Awaited<ReturnType<typeof make>>;
    try { lm = await make("GPU"); } catch { lm = await make("CPU"); }

    return {
      detect(video, ts) {
        // distances & angles are computed in "height units" so non-square video doesn't skew them
        const [vw, vh] = "videoWidth" in video ? [video.videoWidth, video.videoHeight] : [video.naturalWidth, video.naturalHeight];
        const ar = (vw || 4) / (vh || 3);
        const dist = (a: P, b: P) => Math.hypot((a.x - b.x) * ar, a.y - b.y);
        const ang = (a: P, b: P) => Math.atan2(b.y - a.y, (b.x - a.x) * ar);
        if (anchor === "wrist") {
          const r = (lm as import("@mediapipe/tasks-vision").HandLandmarker).detectForVideo(video, ts);
          const h = r.landmarks?.[0];
          if (!h) return null;
          const wrist = h[0], mid = h[9];
          const palm = dist(h[5], h[17]);
          const angle = ang(wrist, mid) + Math.PI / 2;
          // sit the bracelet just below the wrist crease, away from the fingers
          const pt: AnchorPoint = { x: wrist.x - (mid.x - wrist.x) * 0.18, y: wrist.y - (mid.y - wrist.y) * 0.18, scale: palm * 1.9, angle, visible: true };
          return { points: [pt] };
        }
        const r = (lm as import("@mediapipe/tasks-vision").FaceLandmarker).detectForVideo(video, ts);
        const f = r.faceLandmarks?.[0];
        if (!f) return null;
        const left = f[234], right = f[454], top = f[10], chin = f[152];
        const faceW = dist(left, right), faceH = dist(top, chin);
        const angle = ang(left, right);
        if (anchor === "neck") {
          return { points: [{ x: chin.x, y: chin.y + faceH * 0.62, scale: faceW * 1.25, angle, visible: true }] };
        }
        // ears: drop from the face edge at ear level toward the lobe; hide the far ear when the head turns
        const nose = f[1];
        const turn = (nose.x - (left.x + right.x) / 2) / faceW;
        const lobe = (p: P): P => ({ x: p.x, y: p.y + faceH * 0.16 });
        return {
          points: [
            { ...lobe(left), scale: faceW * 0.32, angle, visible: turn < 0.18 },
            { ...lobe(right), scale: faceW * 0.32, angle, visible: turn > -0.18 },
          ],
        };
      },
      close() { lm.close(); },
    };
  },
};
