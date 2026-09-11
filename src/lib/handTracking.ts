import { useEffect, useRef, useState } from "react";

export type HandState = {
  /** normalized 0..1 screen coords (mirrored) */
  x: number;
  y: number;
  pinch: boolean;
  open: boolean;
  detected: boolean;
  /** movement speed in normalized units / frame */
  speed: number;
};

export type TrackerStatus = "idle" | "loading" | "ready" | "error";

const CDN =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";

export function useHandTracking() {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const stateRef = useRef<HandState>({
    x: 0.5,
    y: 0.5,
    pinch: false,
    open: false,
    detected: false,
    speed: 0,
  });

  const [status, setStatus] = useState<TrackerStatus>("idle");
  const [message, setMessage] = useState<string>("");
  const [detected, setDetected] = useState(false);
  const startedRef = useRef(false);

  // Mouse fallback so the game is never unplayable
  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (stateRef.current.detected) return;

      stateRef.current.x = e.clientX / window.innerWidth;
      stateRef.current.y = e.clientY / window.innerHeight;
      stateRef.current.speed = 0.05;
      stateRef.current.pinch = e.buttons > 0;
      stateRef.current.open = e.buttons === 0;
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerdown", move);
    window.addEventListener("pointerup", move);

    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", move);
      window.removeEventListener("pointerup", move);
    };
  }, []);

  const start = async () => {
    if (startedRef.current) return;

    startedRef.current = true;
    setStatus("loading");
    setMessage("Booting neural crow-vision engine...");

    try {
      const vision = await import("@mediapipe/tasks-vision");

      const fileset = await vision.FilesetResolver.forVisionTasks(
        `${CDN}/wasm`
      );

      const landmarker =
        await vision.HandLandmarker.createFromOptions(fileset, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numHands: 1,
        });

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 640,
          height: 480,
          facingMode: "user",
        },
      });

      const video = videoRef.current;

      if (!video) {
        throw new Error("no video element");
      }

      video.srcObject = stream;
      await video.play();

      setStatus("ready");
      setMessage("Hand detected. Kokku probability: 0%");

      let lastTs = -1;
      let prev = { x: 0.5, y: 0.5 };

      const loop = () => {
        if (!videoRef.current) return;

        const ts = performance.now();

        if (video.readyState >= 2 && ts !== lastTs) {
          lastTs = ts;

          const res = landmarker.detectForVideo(video, ts);
          const lm = res.landmarks?.[0];

          if (lm && lm.length >= 21) {
            const wrist = lm[0]!;
            const thumb = lm[4]!;
            const index = lm[8]!;
            const mid = lm[12]!;
            const ring = lm[16]!;
            const pinky = lm[20]!;

            const cx = 1 - (index.x + wrist.x) / 2;
            const cy = (index.y + wrist.y) / 2;

            const px = 1 - index.x;
            const py = index.y;

            const pinchDist = Math.hypot(
              thumb.x - index.x,
              thumb.y - index.y
            );

            const spread =
              (Math.hypot(
                index.x - wrist.x,
                index.y - wrist.y
              ) +
                Math.hypot(
                  mid.x - wrist.x,
                  mid.y - wrist.y
                ) +
                Math.hypot(
                  ring.x - wrist.x,
                  ring.y - wrist.y
                ) +
                Math.hypot(
                  pinky.x - wrist.x,
                  pinky.y - wrist.y
                )) /
              4;

            const x = px * 0.7 + cx * 0.3;
            const y = py * 0.7 + cy * 0.3;

            const speed = Math.hypot(
              x - prev.x,
              y - prev.y
            );

            prev = { x, y };

            stateRef.current = {
              x: Math.min(
                1,
                Math.max(0, (x - 0.15) / 0.7)
              ),
              y: Math.min(
                1,
                Math.max(0, (y - 0.1) / 0.8)
              ),
              pinch: pinchDist < 0.07,
              open:
                spread > 0.28 &&
                pinchDist >= 0.07,
              detected: true,
              speed,
            };

            setDetected(true);
          } else {
            stateRef.current.detected = false;
            stateRef.current.speed = 0;
            setDetected(false);
          }
        }

        requestAnimationFrame(loop);
      };

      requestAnimationFrame(loop);
    } catch (err) {
      console.error(err);

      setStatus("error");

      setMessage(
        "No camera detected. Fallback mode: use your mouse (hold click to pinch)."
      );
    }
  }

  return {
    videoRef,
    stateRef,
    status,
    message,
    detected,
    start,
  };
}