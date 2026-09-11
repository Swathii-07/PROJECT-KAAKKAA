export type CrowMood = "idle" | "happy" | "annoyed" | "shocked" | "dizzy";

type CrowProps = {
  wet?: number; // 0..1
  soap?: number;
  foam?: number;
  whiteness?: number; // 0..1
  hair?: number; // 0..1 ridiculous hairstyle
  level?: number; // 1..3 grooming stage
  legLength?: number; // 1..9 multiplier
  oneLeg?: boolean;
  fallen?: boolean;
  blink?: boolean;
  staring?: boolean;
  mood?: CrowMood;
  fluff?: boolean;
};

export function Crow({
  wet = 0,
  soap = 0,
  foam = 0,
  whiteness = 0,
  hair = 0,
  level=1,
  legLength = 1,
  oneLeg = false,
  fallen = false,
  staring = false,
  mood = "idle",
  fluff = true,
}: CrowProps) {
  const body = `color-mix(in oklab, var(--crow-body) ${100 - Math.round(whiteness * 92)}%, var(--crow-white))`;
  const belly = `color-mix(in oklab, ${body} 74%, white)`;
  const legH = 26 * legLength;

  // mood shapes
  const eyeSquash = mood === "annoyed" ? 0.62 : mood === "happy" ? 0.8 : 1;
  const eyeR = mood === "shocked" ? 19 : 15;
  const pupilR = mood === "shocked" ? 6 : mood === "annoyed" ? 8 : 9;
  
  return (
    <div
      className={`relative select-none transition-transform duration-500 ${
        fallen ? "" : mood === "dizzy" ? "animate-wobble" : "animate-bob"
      }`}
      style={{
        transform: `rotate(${fallen ? 18 : oneLeg ? -4 : 0}deg) translateY(${fallen ? 14 : 0}px)`,
        filter: wet > 0.2 ? `saturate(${1 + wet * 0.4}) brightness(${1 + wet * 0.15})` : undefined,
      }}
    >
      <svg viewBox="0 0 240 300" className="h-[52vh] w-auto drop-shadow-[0_18px_28px_rgba(0,0,0,0.25)]">

        {/* tail feathers */}
        <g className="animate-tail" style={{ transformOrigin: "60px 170px" }}>
          <path d="M62 162 Q 14 148 6 178 Q 36 178 64 188 Z" fill={body} />
          <path d="M62 172 Q 20 168 14 194 Q 40 190 64 196 Z" fill={belly} opacity="0.7" />
        </g>

        {/* fluffy body */}
        <ellipse cx="120" cy="168" rx="62" ry="54" fill={body} />
        {/* fluffy chest scallops */}
        {fluff && (
          <g fill={belly} opacity="0.35">
            {[...Array(5)].map((_, i) => (
              <circle key={i} cx={96 + i * 14} cy={188 - Math.abs(i - 2) * 5} r="15" />
            ))}
          </g>
        )}

        {/* wing - flipped, diagonal like the tail */}
        <g className="animate-flap" style={{ transformOrigin: "115px 160px" }}>
          <g transform="translate(-25 -15) rotate(-25 115 160)">
            <path
              d="M126 140
                Q 92 138 58 166
                Q 72 196 108 202
                Q 126 178 126 140 Z"
              fill={`color-mix(in oklab, ${body} 72%, black)`}
              opacity={0.95}
            />

            <path
              d="M119 150
                Q 91 157 68 177"
              stroke="#35353a"
              strokeWidth="4"
              fill="none"
              opacity={0.9}
            />
          </g>
        </g>

        {/* head — big and round for maximum cute */}
        <g className={mood === "shocked" ? "animate-shake" : "animate-headbob"} style={{ transformOrigin: "120px 130px" }}>
          <circle cx="120" cy="98" r="48" fill={body} />
          {/* hairstyle */}
          {hair >= 0.98 && (
            <path
              d="M91 62 Q88 45 101 52 Q104 32 115 51 Q120 27 126 51 Q138 32 140 54 Q153 43 149 64"
              stroke={body}
              strokeWidth="6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          {/* head fluff tuft */}
          <path d="M108 52 Q 116 34 126 52" stroke={body} strokeWidth="7" fill="none" strokeLinecap="round" />
          <path d="M122 54 Q 132 38 140 56" stroke={body} strokeWidth="6" fill="none" strokeLinecap="round" />
          {/* blush */}
          <ellipse
            cx="90"
            cy="112"
            rx="10"
            ry="6"
            fill="var(--fun)"
            opacity={mood === "shocked" ? 0.15 : 0.3}
          />

          <ellipse
            cx="150"
            cy="112"
            rx="10"
            ry="6"
            fill="var(--fun)"
            opacity={mood === "shocked" ? 0.15 : 0.3}
          />

          {/* proper crow beak */}
          <path
            d="M132 108
              L178 112
              L138 120
              Z"
            fill="var(--crow-beak)"
          />

          <path
            d="M134 114 L176 112"
            stroke="color-mix(in oklab, var(--crow-beak) 60%, black)"
            strokeWidth="1.8"
            fill="none"
            strokeLinecap="round"
          />

          {/* eyes — big and expressive */}
          <g className="animate-blinky" style={{ transformOrigin: "120px 92px" }}>
            <ellipse cx="102" cy="92" rx={eyeR} ry={eyeR * eyeSquash} fill="white" />
            <ellipse cx="140" cy="92" rx={eyeR} ry={eyeR * eyeSquash} fill="white" />
            <circle cx={staring ? 105 : 103} cy={mood === "annoyed" ? 90 : 94} r={pupilR} fill="#181022" />
            <circle cx={staring ? 143 : 141} cy={mood === "annoyed" ? 90 : 94} r={pupilR} fill="#181022" />
            <circle cx={101} cy={89} r="3" fill="white" />
            <circle cx={139} cy={89} r="3" fill="white" />
          </g>

          {/* eyebrows for mood */}
          {mood === "annoyed" && (
            <g stroke="#181022" strokeWidth="4" strokeLinecap="round">
              <path d="M90 72 L 112 80" />
              <path d="M150 72 L 128 80" />
            </g>
          )}
          {mood === "shocked" && (
            <g stroke="#181022" strokeWidth="4" strokeLinecap="round">
              <path d="M90 66 Q 102 60 112 66" />
              <path d="M128 66 Q 140 60 150 66" />
            </g>
          )}

          

          
        </g>

        {/* legs */}
        <g stroke="var(--crow-beak)" strokeWidth="7" strokeLinecap="round" fill="none">
          <path d={`M110 214 L 110 ${214 + legH}`} />
          <path d={`M110 ${214 + legH} l -14 10 M110 ${214 + legH} l 14 10`} />
          {!oneLeg && (
            <>
              <path d={`M144 214 L 144 ${214 + legH}`} />
              <path d={`M144 ${214 + legH} l -14 10 M144 ${214 + legH} l 14 10`} />
            </>
          )}
          {oneLeg && <path d="M144 214 Q 176 210 168 186" />}
        </g>

        {/* dizzy stars */}
        {mood === "dizzy" && (
          <g className="animate-wiggle" style={{ transformOrigin: "120px 40px" }}>
            <text x="86" y="44" fontSize="22">
              💫
            </text>
            <text x="132" y="38" fontSize="18">
              💫
            </text>
          </g>
        )}

        {/* water drips */}
        {wet > 0.1 && (level === 2 || level === 3) &&
          [...Array(7)].map((_, i) => (
            <ellipse
              key={i}
              cx={70 + i * 16}
              cy={212}
              rx="4"
              ry="7"
              fill="var(--water)"
              opacity={Math.min(0.9, wet)}
              className="animate-drip"
              style={{ animationDelay: `${i * 220}ms` }}
            />
          ))}

        {/* soap smears */}
        {soap > 0.05 &&
          [...Array(6)].map((_, i) => (
            <circle
              key={i}
              cx={92 + (i % 3) * 28}
              cy={142 + Math.floor(i / 3) * 34}
              r={10 + soap * 8}
              fill="white"
              opacity={Math.min(0.7, soap * 0.8)}
            />
          ))}
      </svg>

      {/* shampoo foam crown */}
      {foam > 0.05 && (
        <div className="pointer-events-none absolute left-1/2 top-[2%] -translate-x-1/2">
          {[...Array(14)].map((_, i) => (
            <span
              key={i}
              className="absolute rounded-full bg-white/85 animate-float"
              style={{
                width: 12 + ((i * 7) % 22) * foam,
                height: 12 + ((i * 7) % 22) * foam,
                left: (i % 7) * 22 - 70,
                top: Math.floor(i / 7) * -18,
                animationDelay: `${i * 130}ms`,
                opacity: Math.min(1, foam),
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
