import { createFileRoute } from "@tanstack/react-router";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Crow, type CrowMood } from "@/components/game/Crow";
import { Bar, Confetti, HandCursor, StatLine, WebcamPip } from "@/components/game/ui";
import { useHandTracking } from "@/lib/handTracking";
import { music, sfx } from "@/lib/sfx";

const FUNNY_LINES = [
  "Crow is judging you 👁",
  "Error 404: Crane not found",
  "Crow.exe is confused",
  "Please stop washing the bird.",
  "kakka-net v0.1: still 100% CROW",
  "Bird has filed a complaint 📄",
  "Feathers: clean. Species: unchanged.",
  "Warning: excessive bathing detected",
  "Crane API returned null 🪽",
  "കാക്ക: “മതി മതി…”",
  "Scientists are baffled (they are not)",
  "Loading crane DNA… failed (again)",
];

const ACHIEVEMENTS = [
  "🏆 Achievement: Wet Bird Enjoyer",
  "🏆 Achievement: Soap Overlord",
  "🏆 Achievement: Bubble Architect",
  "🏆 Achievement: Certified Hair Stylist",
  "🏆 Achievement: Paint Wasted Beautifully",
  "🏆 Achievement: Fall Damage Specialist",
  "🏆 Achievement: Stilt Engineer",
  "🏆 Achievement: Professional Disappointment",
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KAKKA KULICHAL KOKKAVILLA 🐦🚿 — Useless Crow Bathing Simulator" },
      {
        name: "description",
        content:
          "A gloriously useless webcam hand-tracking game: bathe, soap, shampoo, comb and whitewash a cartoon crow across 8 levels. It will never become a crane.",
      },
      { property: "og:title", content: "KAKKA KULICHAL KOKKAVILLA 🐦🚿" },
      {
        property: "og:description",
        content:
          "Wave your hand at your webcam and try to turn a crow into a crane. Spoiler: കാക്ക കുളിച്ചാൽ കൊക്കാവില്ല.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;700;800&family=Noto+Sans+Malayalam:wght@500;700&display=swap",
      },
    ],
  }),
  component: Game,
});

const MemoCrow = memo(Crow);

type LevelKind = "scrub" | "balance" | "legs" | "final";

type Level = {
  n: number;
  title: string;
  emoji: string;
  tool: string;
  barLabel: string;
  hint: string;
  kind: LevelKind;
  needPinch: boolean;
  resultTitle: string;
  resultStats: [string, string][];
};

const LEVELS: Level[] = [
  {
    n: 1,
    title: "WATER",
    emoji: "🚿",
    tool: "🚿",
    barLabel: "Cleanliness",
    hint: "Open palm 🖐 and move the shower over the kakka",
    kind: "scrub",
    needPinch: false,
    resultTitle: "Kakka is wet. Kokku-ness: 0%",
    resultStats: [
      ["Water used", "41 litres"],
      ["Kokku-ness", "0%"],
    ],
  },
  {
    n: 2,
    title: "SOAP",
    emoji: "🧼",
    tool: "🧼",
    barLabel: "Soapiness",
    hint: "Pinch 🤏 the soap and rub it all over the kakka",
    kind: "scrub",
    needPinch: true,
    resultTitle: "Very clean. Still KAKKA.",
    resultStats: [
      ["Bacteria removed", "99.98%"],
      ["Crow-ness removed", "0.00%"],
    ],
  },
  {
    n: 3,
    title: "SHAMPOO",
    emoji: "🫧",
    tool: "🫧",
    barLabel: "Lather",
    hint: "Pinch 🤏 and scrub the shampoo into those feathers",
    kind: "scrub",
    needPinch: true,
    resultTitle: "Feathers are fabulous. Species: KAKKA.",
    resultStats: [
      ["Feather shine", "87%"],
      ["Kokku-ness", "0.01%"],
      ["Neural confidence", "99.4% CROW"],
    ],
  },
  {
    n: 4,
    title: "GROOMING",
    emoji: "🪮",
    tool: "🪮",
    barLabel: "Hairstyle chaos",
    hint: "Pinch 🤏 the comb and drag it across the head",
    kind: "scrub",
    needPinch: true,
    resultTitle: "Style improved. Species unchanged.",
    resultStats: [
      ["Drip factor", "112%"],
      ["Combs destroyed", "3"],
      ["Kokku-ness", "0%"],
    ],
  },
  {
    n: 5,
    title: "WHITEWASH",
    emoji: "🤍",
    tool: "🖌️",
    barLabel: "Paint applied",
    hint: "Pinch 🤏 the brush and paint the kakka white",
    kind: "scrub",
    needPinch: true,
    resultTitle: "IT IS WHITE! …and still a KAKKA.",
    resultStats: [
      ["Surface whiteness", "100%"],
      ["Genetic crow-ness", "99.9%"],
      ["Kokku-ness", "0%"],
    ],
  },
  {
    n: 6,
    title: "CRANE TRAINING",
    emoji: "🪽",
    tool: "🖐",
    barLabel: "Crane behaviour",
    hint: "Hold an open palm 🖐 in the TOP part of the screen to lift one leg",
    kind: "balance",
    needPinch: false,
    resultTitle: "Balance achieved. Crane behaviour: 2%",
    resultStats: [
      ["Falls", "38"],
      ["Crane behaviour", "2%"],
    ],
  },
  {
    n: 7,
    title: "LEG UPGRADE",
    emoji: "🦵",
    tool: "🦵",
    barLabel: "Leg extension",
    hint: "Pinch 🤏 near the legs and drag UPWARDS to stretch them",
    kind: "legs",
    needPinch: true,
    resultTitle: "Legs maxed out. Still a kakka on stilts.",
    resultStats: [
      ["Leg length", "900%"],
      ["Crane-ness", "0%"],
    ],
  },
  {
    n: 8,
    title: "FINAL TRANSFORMATION",
    emoji: "🧬",
    tool: "🤏",
    barLabel: "Transformation",
    hint: "Pinch 🤏 the giant button to begin the transformation",
    kind: "final",
    needPinch: true,
    resultTitle: "TRANSFORMATION FAILED",
    resultStats: [["Reason", "KAKKA IS KAKKA."]],
  },
];

type Phase = "intro" | "play" | "levelDone" | "final";

function Game() {
  const { videoRef, stateRef, status, message, detected, start } = useHandTracking();
  const [phase, setPhase] = useState<Phase>("intro");
  const [levelIdx, setLevelIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [cursor, setCursor] = useState({ x: 0, y: 0, pinch: false, open: false });
  const [wet, setWet] = useState(0);
  const [soap, setSoap] = useState(0);
  const [foam, setFoam] = useState(0);
  const [hair, setHair] = useState(0);
  const [whiteness, setWhiteness] = useState(0);
  const [legLength, setLegLength] = useState(1);
  const [oneLeg, setOneLeg] = useState(false);
  const [fallen, setFallen] = useState(false);
  const [falls, setFalls] = useState(0);
  const [confetti, setConfetti] = useState(false);
  const [loading, setLoading] = useState<number | null>(null);
  const [splashes, setSplashes] = useState<{ id: number; x: number; y: number }[]>([]);
  const [mood, setMood] = useState<CrowMood>("idle");
  const [quip, setQuip] = useState(FUNNY_LINES[0]!);
  const [achievement, setAchievement] = useState<string | null>(null);
  const [musicOn, setMusicOn] = useState(false);
  const [coverage, setCoverage] = useState(0);
  const crowRef = useRef<HTMLDivElement | null>(null);
  const progressRef = useRef(0);
  const coverageRef = useRef(0);
  const phaseRef = useRef<Phase>("intro");
  const levelRef = useRef(0);
  const holdRef = useRef(0);
  const nextFallRef = useRef(0);
  const lastLegYRef = useRef<number | null>(null);
  const cellsRef = useRef<Set<string>>(new Set());
  const moodTimer = useRef<number | null>(null);
  const lastProgressUpdateRef = useRef(0);

  const react = useCallback((m: CrowMood, ms = 1100) => {
    setMood(m);
    if (moodTimer.current) window.clearTimeout(moodTimer.current);
    moodTimer.current = window.setTimeout(() => setMood("idle"), ms);
  }, []);

  phaseRef.current = phase;
  levelRef.current = levelIdx;
  progressRef.current = progress;
  coverageRef.current = coverage;

  const level = LEVELS[levelIdx]!;

  const addSplash = useCallback((x: number, y: number) => {
    const id = Math.random();
    setSplashes((s) => [...s.slice(-9), { id, x, y }]);
    setTimeout(() => setSplashes((s) => s.filter((p) => p.id !== id)), 700);
  }, []);

  const completeLevel = useCallback(() => {
    setPhase("levelDone");
    setConfetti(true);
    setMood("happy");
    sfx.levelUp();
    setAchievement(ACHIEVEMENTS[levelRef.current] ?? null);
    setTimeout(() => sfx.achievement(), 500);
    setTimeout(() => sfx.caw(), 900);
    setTimeout(() => setConfetti(false), 2600);
  }, []);

  // rotating funny commentary
  useEffect(() => {
    if (phase === "final") return;
    const t = setInterval(() => {
      setQuip(FUNNY_LINES[Math.floor(Math.random() * FUNNY_LINES.length)]!);
      if (Math.random() < 0.35) react(Math.random() < 0.5 ? "annoyed" : "shocked", 1300);
    }, 5200);
    return () => clearInterval(t);
  }, [phase, react]);

  // main game loop
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const s = stateRef.current;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const px = s.x * w;
      const py = s.y * h;
      setCursor({ x: px, y: py, pinch: s.pinch, open: s.open });

      if (phaseRef.current !== "play") return;
      const lv = LEVELS[levelRef.current]!;
      const box = crowRef.current?.getBoundingClientRect();

      if (lv.kind === "scrub" || lv.kind === "legs") {
        const over =
          !!box && px > box.left - 40 && px < box.right + 40 && py > box.top - 40 && py < box.bottom + 40;
        const active = over && (lv.needPinch ? s.pinch : s.open || s.pinch);
        if (active) {
          if (lv.kind === "legs") {
            const dy = lastLegYRef.current === null ? 0 : lastLegYRef.current - py;
            lastLegYRef.current = py;
            if (dy > 1) {
              setLegLength((l) => Math.min(9, l + dy * 0.02));
              setProgress((p) => {
                const np = Math.min(100, p + dy * 0.34);
                if (np > p + 4) sfx.boing();
                return np;
              });
            }
          } else {
            // coverage: you must actually scrub the WHOLE bird
            if (box) {
              const cx = Math.min(3, Math.max(0, Math.floor(((px - box.left) / box.width) * 4)));
              const cy = Math.min(3, Math.max(0, Math.floor(((py - box.top) / box.height) * 4)));
              const key = `${cx}-${cy}`;
               if (!cellsRef.current.has(key)) {
                cellsRef.current.add(key);

                const newCoverage = Math.round(
                  (cellsRef.current.size / 16) * 100
                );

                setCoverage(newCoverage);

                const cells = cellsRef.current.size;

                const progressValues = [
                  0, 4, 10, 17, 25,
                  34, 43, 52, 61,
                  70, 78, 85, 91,
                  95, 98, 99, 100
                ];

                // cells is 1..16; clamp to valid index (0..progressValues.length-1)
                const idx = Math.min(cells, progressValues.length - 1);
                const p = progressValues[idx] ?? 0;
                setProgress(p);

                sfx.bubble();
              }
            }
            
            if (Math.random() < 0.16) addSplash(px, py);
            if (Math.random() < 0.25) {
              if (lv.n === 1) sfx.splash();
              else if (lv.n === 2) sfx.bubble();
              else if (lv.n === 3) sfx.shampoo();
              else if (lv.n === 4) sfx.comb();
              else sfx.squeak();
            }
            if (Math.random() < 0.004) {
              react(Math.random() < 0.5 ? "annoyed" : "shocked", 1200);
              sfx.cawAngry();
            }
            const step = progressRef.current >= 100 ? 0.007 : 0.018;
            if (lv.n === 1) setWet((v) => Math.min(1, v + step));
            if (lv.n === 2) setSoap((v) => Math.min(1, v + step));
            if (lv.n === 3) setFoam((v) => Math.min(1, v + step));
            if (lv.n === 4) setHair((v) => Math.min(1, v + step));
            if (lv.n === 5) setWhiteness((v) => Math.min(1, v + step * 0.9));
          }
        } else if (lv.kind === "legs") {
          lastLegYRef.current = py;
        }
        if (lv.kind === "scrub") {
          if (progressRef.current >= 100 && coverageRef.current >= 100) {
            if (lv.n === 5) setWhiteness(1);
            completeLevel();
          }
        }

        if (lv.kind === "legs") {
          if (progressRef.current >= 100) {
            completeLevel();
          }
        }
      }

      if (lv.kind === "balance") {
        const high = py < h * 0.42 && (s.open || !s.detected);
        setOneLeg(high);
        if (high) {
          holdRef.current += 1;
          setProgress(Math.min(100, (holdRef.current / 300) * 100));
          if (performance.now() > nextFallRef.current) {
            nextFallRef.current = performance.now() + 1200 + Math.random() * 1400;
            setFallen(true);
            setFalls((f) => f + 1);
            sfx.thud();
            setTimeout(() => sfx.cawAngry(), 200);
            react("dizzy", 1400);
            holdRef.current = Math.max(0, holdRef.current - 30);
            setTimeout(() => setFallen(false), 700);
          }
        }
        if (progressRef.current >= 100 ) completeLevel();
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [stateRef, addSplash, completeLevel, react]);

  const beginLevel = (idx: number) => {
    setLevelIdx(idx);
    setProgress(0);
    holdRef.current = 0;
    nextFallRef.current = performance.now() + 2200;
    lastLegYRef.current = null;
    cellsRef.current = new Set();
    setCoverage(0);
    setAchievement(null);
    setOneLeg(false);
    setMood("idle");
    setPhase("play");
    sfx.boop();
  };

  const nextLevel = () => {
    // after the whitewash the kakka STAYS white forever — and is still a kakka
    if (level.n === 5) {
      setWhiteness(1);
      sfx.caw();
    }
    if (levelIdx >= LEVELS.length - 1) setPhase("final");
    else beginLevel(levelIdx + 1);
  };

  const toggleMusic = () => {
    setMusicOn(music.toggle());
    sfx.boop();
  };

  const startedTransformRef = useRef(false);
  const finalBtnRef = useRef<HTMLButtonElement | null>(null);

  const runTransformation = useCallback(() => {
    if (startedTransformRef.current) return;
    startedTransformRef.current = true;
    sfx.drama();
    const steps = [0, 12, 47, 99, 100];
    steps.forEach((v, i) => {
      setTimeout(() => {
        setLoading(v);
        setProgress(v);
        sfx.boop();
        if (v === 47) react("shocked", 1600);
        if (v === 99) sfx.drama();
      }, i * 1100);
    });
    setTimeout(() => {
      sfx.fail();
      react("annoyed", 4000);
      setTimeout(() => sfx.cawAngry(), 600);
      completeLevel();
    }, steps.length * 1100 + 900);
  }, [completeLevel, react]);

  // pinch the giant button with your hand
  useEffect(() => {
    const t = setInterval(() => {
      const el = finalBtnRef.current;
      if (!el || startedTransformRef.current) return;
      const b = el.getBoundingClientRect();
      const s = stateRef.current;
      const x = s.x * window.innerWidth;
      const y = s.y * window.innerHeight;
      if (s.pinch && x > b.left && x < b.right && y > b.top && y < b.bottom) runTransformation();
    }, 120);
    return () => clearInterval(t);
  }, [runTransformation, stateRef]);


  const startGame = async () => {
    sfx.boop();
    music.start();
    setMusicOn(true);
    await start();
    beginLevel(0);
  };

  return (
    <main
      className="relative min-h-screen overflow-hidden font-display text-foreground"
      style={{ background: "var(--gradient-sky)" }}
    >
      {/* floating background bubbles */}
      {[...Array(12)].map((_, i) => (
        <span
          key={i}
          className="pointer-events-none absolute rounded-full bg-white/30 animate-float"
          style={{
            width: 26 + ((i * 13) % 60),
            height: 26 + ((i * 13) % 60),
            left: `${(i * 8.5) % 96}%`,
            top: `${(i * 17) % 90}%`,
            animationDelay: `${i * 240}ms`,
          }}
        />
      ))}

      <Confetti show={confetti} />
      <HandCursor x={cursor.x} y={cursor.y} pinch={cursor.pinch} tool={phase === "play" ? level.tool : "🖐"} />
      <div
        className={`fixed bottom-4 right-4 z-40 w-52 fun-panel p-2 text-xs ${
          phase === "intro" ? "hidden" : ""
        }`}
      >
        <div className="relative overflow-hidden rounded-xl border-2 border-foreground bg-foreground/80">
          <video
            ref={videoRef}
            muted
            autoPlay
            playsInline
            className="h-28 w-full scale-x-[-1] object-cover"
          />

          <span
            className={`absolute left-1.5 top-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${
              detected
                ? "bg-fun-2 text-foreground"
                : "bg-primary text-primary-foreground"
            }`}
          >
            {status === "ready"
              ? detected
                ? "HAND LOCKED"
                : "SHOW HAND"
              : status.toUpperCase()}
          </span>
        </div>

        <div className="mt-2 flex gap-1 font-bold">
          <span className={`rounded-full px-2 py-0.5 ${cursor.open ? "bg-fun-2" : "bg-muted"}`}>
            🖐 palm
          </span>

          <span className={`rounded-full px-2 py-0.5 ${cursor.pinch ? "bg-fun text-white" : "bg-muted"}`}>
            🤏 pinch
          </span>
        </div>

        <p className="mt-1 leading-tight text-muted-foreground">
          {message}
        </p>
      </div>

      {splashes.map((sp) => (
        <span
          key={sp.id}
          className="pointer-events-none fixed z-30 -translate-x-1/2 -translate-y-1/2 text-3xl animate-pop-in"
          style={{ left: sp.x, top: sp.y }}
        >
          {level.n === 1 ? "💦" : level.n === 2 ? "🫧" : level.n === 3 ? "🫧" : level.n === 4 ? "✨" : "🤍"}
        </span>
      ))}

      {/* music toggle */}
      <button
        onClick={toggleMusic}
        className="fun-btn fixed left-4 top-4 z-40 bg-accent px-4 py-2 text-sm font-extrabold"
      >
        {musicOn ? "🎵 MUSIC ON" : "🔇 MUSIC OFF"}
      </button>

      {/* funny commentary */}
      {phase !== "intro" && (
        <div
          key={quip}
          className="fun-panel animate-pop-in fixed left-1/2 top-4 z-40 -translate-x-1/2 px-4 py-2 text-sm font-extrabold"
        >
          {quip}
        </div>
      )}

      {achievement && (
        <div className="fun-panel animate-pop-in fixed bottom-4 left-4 z-40 bg-accent px-4 py-2 text-sm font-extrabold">
          {achievement}
        </div>
      )}

      {/* HEADER */}
      <header className="relative z-20 px-4 pt-16 text-center">
        <h1 className="font-display text-3xl font-extrabold leading-none tracking-tight sm:text-5xl">
          <span className="text-primary">KAKKA KULICHAL</span>{" "}
          <span className="text-secondary-foreground">KOKKAVILLA</span> 🐦🚿
        </h1>
        <p className="mt-1 font-mal text-base text-foreground/70 sm:text-lg">
          കാക്ക കുളിച്ചാൽ കൊക്കാവില്ല — an intentionally useless CV experiment
        </p>
      </header>

      {phase === "intro" && <Intro onStart={startGame} />}

      {phase !== "intro" && phase !== "final" && (
        <section className="relative z-20 mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 pb-24 pt-4">
          <div className="w-full fun-panel px-5 py-3">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <span className="rounded-full bg-accent px-3 py-1 text-sm font-extrabold">
                LEVEL {level.n}/8 — {level.title} {level.emoji}
              </span>
              <span className="text-xs font-bold uppercase text-muted-foreground">
                Kokku-ness: 0.00% · model: kakka-net v0.1
              </span>
            </div>
            <Bar label={level.barLabel} value={progress} tone={level.n === 1 ? "water" : "fun"} />
            {level.kind === "scrub" && (
              <div className="mt-2">
                <Bar label="Body coverage (scrub everywhere!)" value={coverage} tone="fun-2" />
              </div>
            )}
            <p className="mt-2 text-sm font-semibold text-foreground/70">{level.hint}</p>
          </div>

          <div ref={crowRef} className="relative">
            <MemoCrow
              wet={wet}
              soap={level.n === 2 ? soap : 0}
              foam={level.n === 3 ? foam : 0}
              hair={hair}
              whiteness={whiteness}
              legLength={legLength}
              oneLeg={oneLeg}
              fallen={fallen}
              mood={mood}
            />
            {fallen && (
              <span className="absolute -right-10 top-4 rotate-12 rounded-2xl bg-primary px-3 py-1 text-sm font-extrabold text-primary-foreground animate-pop-in">
                THUD! വീണു! 💥
              </span>
            )}
            {mood === "annoyed" && !fallen && (
              <span className="absolute -left-6 top-0 -rotate-6 rounded-2xl bg-accent px-3 py-1 text-sm font-extrabold animate-pop-in">
                “മതി!” 😠
              </span>
            )}
            {mood === "shocked" && (
              <span className="absolute -right-8 top-0 rotate-6 rounded-2xl bg-secondary px-3 py-1 text-sm font-extrabold animate-pop-in">
                😱 what
              </span>
            )}
          </div>

          {level.kind === "balance" && (
            <p className="text-sm font-bold text-primary animate-shake">
              Falls so far: {falls} · Crane behaviour: 2% · Bird dignity: 0%
            </p>
          )}

          {level.kind === "legs" && (
            <p className="text-sm font-bold text-primary">
              Leg length: {Math.round(legLength * 100)}% · Crane-ness: 0% · Stilt warranty: void
            </p>
          )}

          {level.n >= 6 && whiteness > 0.5 && (
            <p className="text-sm font-bold text-fun-2">
              Looks like a kokku. Genetically still 100% KAKKA. 🧬
            </p>
          )}

          {level.kind === "final" && phase === "play" && (
            <button
              ref={finalBtnRef}
              onPointerDown={runTransformation}
              className="fun-btn bg-primary px-10 py-6 text-2xl font-extrabold text-primary-foreground sm:text-4xl"
            >
              {loading === null ? "BECOME KOKKU 🧬" : `TRANSFORMING… ${loading}%`}
            </button>
          )}


          {phase === "levelDone" && (
            <div className="w-full max-w-md fun-panel animate-pop-in px-6 py-5 text-center">
              <p className="text-2xl font-extrabold text-primary">{level.resultTitle}</p>
              <div className="mt-3 text-left">
                {level.resultStats.map(([k, v]) => (
                  <StatLine key={k} label={k} value={v} />
                ))}
              </div>
              <button
                onClick={nextLevel}
                className="fun-btn mt-4 bg-accent px-6 py-3 text-lg font-extrabold"
              >
                {levelIdx >= LEVELS.length - 1 ? "See the sad truth →" : "Next ridiculous level →"}
              </button>
            </div>
          )}
        </section>
      )}

      {phase === "final" && <FinalScreen falls={falls} whiteness={whiteness} />}
    </main>
  );
}

function Intro({ onStart }: { onStart: () => void }) {
  return (
    <section className="relative z-20 mx-auto flex max-w-3xl flex-col items-center gap-5 px-4 py-8 text-center">
      <div className="animate-float">
        <MemoCrow staring />
      </div>
      <div className="fun-panel px-6 py-5">
        <p className="text-lg font-bold">
          Mission: use your <b className="text-primary">hand + webcam</b> to bathe, soap, shampoo, comb,
          whitewash and re-engineer this crow into a crane.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          8 levels. Advanced fake machine learning. Guaranteed failure. No camera? Mouse works too (hold click
          = pinch).
        </p>
        <button
          onClick={onStart}
          className="fun-btn mt-4 bg-primary px-8 py-4 text-xl font-extrabold text-primary-foreground"
        >
          ENABLE HAND TRACKING 🖐 START BATHING
        </button>
      </div>
    </section>
  );
}

function FinalScreen({ falls, whiteness = 1 }: { falls: number; whiteness?: number }) {
  const [stare, setStare] = useState(false);
  useEffect(() => {
    sfx.drama();
    const t = setTimeout(() => {
      setStare(true);
      sfx.cawAngry();
    }, 2200);
    return () => clearTimeout(t);
  }, []);
  return (
    <section className="relative z-20 mx-auto flex max-w-4xl flex-col items-center gap-5 px-4 pb-24 pt-4 text-center">
      <div className="fun-panel animate-pop-in px-6 py-4">
        <p className="text-3xl font-extrabold text-primary animate-shake">TRANSFORMATION FAILED</p>
        <p className="mt-1 text-xl font-extrabold">Reason: “KAKKA IS KAKKA.”</p>
      </div>

      <div className="grid w-full gap-5 sm:grid-cols-2">
        <div className="fun-panel px-6 py-5 text-left">
          <h2 className="mb-2 text-xl font-extrabold">Completely meaningless statistics</h2>
          <StatLine label="Baths taken" value="8" />
          <StatLine label="Soap used" value="14" />
          <StatLine label="Shampoo used" value="6" />
          <StatLine label="Combs destroyed" value="3" />
          <StatLine label="Crane training attempts" value="1,247" />
          <StatLine label="Actual falls witnessed" value={String(falls)} />
          <StatLine label="Kokku-ness" value="0%" />
        </div>
        <div className="fun-panel flex flex-col items-center justify-center px-6 py-5">
          <MemoCrow wet={0.4} whiteness={whiteness} staring={stare} mood={stare ? "annoyed" : "idle"} />
          <p className="mt-2 text-2xl font-extrabold">🐦 KAKKA · 🪽 KOKKU-NESS: 0%</p>
          <p className="mt-1 text-sm font-bold text-muted-foreground">
            White on the outside. Kakka all the way down.
          </p>
        </div>
      </div>

      <p className="font-mal text-3xl font-bold leading-snug sm:text-5xl">
        “കാക്ക കുളിച്ചു.
        <br />
        കൊക്കായില്ല.”
      </p>

      {stare && (
        <div className="fun-panel animate-pop-in bg-accent px-6 py-4">
          <p className="font-mal text-xl font-bold sm:text-2xl">
            “എത്ര കുളിപ്പിച്ചാലും ഞാൻ കാക്ക തന്നെയാ.”
          </p>
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-3">
        <button
          onClick={() => window.location.reload()}
          className="fun-btn bg-primary px-8 py-4 text-lg font-extrabold text-primary-foreground"
        >
          Waste your time again 🚿
        </button>

        <button
          onClick={() => {
            document.body.innerHTML = `
              <div style="
                min-height:100vh;
                display:flex;
                flex-direction:column;
                align-items:center;
                justify-content:center;
                text-align:center;
                font-family:sans-serif;
                background:#e0f2fe;
                padding:20px;
              ">
                <div style="font-size:80px;">🐦‍⬛</div>
                <h1 style="font-size:40px;margin:10px 0;">KAKKA HAS LEFT THE CHAT.</h1>
                <p style="font-size:20px;">The crow is still a crow. Your mission is complete.</p>
                <p style="margin-top:20px;">You can now close this tab. 🚪</p>
              </div>
            `;
          }}
          className="fun-btn bg-muted px-8 py-4 text-lg font-extrabold"
        >
          Quit 🚪
        </button>
      </div>
    </section>
  );
}
