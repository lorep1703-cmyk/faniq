import { STAGE_CONFIG } from "./JourneyBadge";

// Stadi in ordine logico sulla linea principale
const MAIN_STAGES = ["SCOPERTA", "ABITUDINE", "FEDELTA", "PICCO"];
// Rami negativi — mostrati sotto la linea
const BRANCH_STAGES = ["RISCHIO", "DORMIENTE", "RECUPERATO"];

const TOOLTIPS = {
  SCOPERTA:   "Prima interazione con il club — tifoso nuovo da coltivare.",
  ABITUDINE:  "Viene alle partite con una certa regolarità.",
  FEDELTA:    "Presenza alta e stabile — uno dei tuoi pilastri.",
  PICCO:      "Massima fedeltà: non perde mai una partita.",
  RISCHIO:    "La frequenza sta calando — intervieni prima che smetta.",
  DORMIENTE:  "Assente da molte partite. Serve una campagna di riattivazione.",
  RECUPERATO: "Era dormiente, è tornato. Momento perfetto per fidelizzarlo.",
};

function StageNode({ stageKey, currentStage, isMain }) {
  const cfg = STAGE_CONFIG[stageKey];
  const isCurrent = currentStage?.toUpperCase() === stageKey;
  const isCompleted = isMain && (() => {
    const idx = MAIN_STAGES.indexOf(stageKey);
    const curIdx = MAIN_STAGES.indexOf(currentStage?.toUpperCase());
    return curIdx > idx;
  })();

  return (
    <div className="relative group flex flex-col items-center gap-1">
      {/* Cerchio nodo */}
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center text-lg transition-all
          ${isCurrent
            ? "ring-2 ring-offset-2 shadow-md scale-110"
            : isCompleted
            ? "opacity-40"
            : "opacity-30"
          }`}
        style={isCurrent || isCompleted
          ? { backgroundColor: cfg.bg, ringColor: cfg.color }
          : { backgroundColor: "#f1f5f9" }
        }
      >
        <span className={isCurrent ? "" : "grayscale"}>{cfg.icon}</span>
      </div>

      {/* Label */}
      <span
        className={`text-xs font-medium whitespace-nowrap ${
          isCurrent ? "font-bold" : "text-slate-400"
        }`}
        style={isCurrent ? { color: cfg.color } : {}}
      >
        {cfg.label}
      </span>

      {/* Tooltip */}
      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-10 pointer-events-none">
        <div className="bg-slate-800 text-white text-xs rounded-lg px-3 py-2 max-w-[160px] text-center shadow-lg">
          {TOOLTIPS[stageKey]}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
        </div>
      </div>
    </div>
  );
}

export default function JourneyTimeline({ currentStage }) {
  const normalizedStage = currentStage?.toUpperCase();
  const isInBranch = BRANCH_STAGES.includes(normalizedStage);

  return (
    <div className="w-full">
      {/* Linea principale */}
      <div className="relative flex items-start justify-between gap-0">
        {MAIN_STAGES.map((key, i) => (
          <div key={key} className="flex items-center flex-1">
            <StageNode stageKey={key} currentStage={currentStage} isMain />
            {i < MAIN_STAGES.length - 1 && (
              <div className="flex-1 h-0.5 bg-slate-200 mt-[-18px]" />
            )}
          </div>
        ))}
      </div>

      {/* Separatore rami negativi */}
      <div className="mt-4 mb-3 flex items-center gap-2">
        <div className="flex-1 h-px bg-slate-100" />
        <span className="text-xs text-slate-300 whitespace-nowrap">rami alternativi</span>
        <div className="flex-1 h-px bg-slate-100" />
      </div>

      {/* Rami negativi */}
      <div className="flex justify-around">
        {BRANCH_STAGES.map((key) => {
          const cfg = STAGE_CONFIG[key];
          const isCurrent = normalizedStage === key;
          return (
            <div key={key} className="relative group flex flex-col items-center gap-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-base transition-all
                  ${isCurrent ? "ring-2 ring-offset-2 shadow-md scale-110" : "opacity-30"}`}
                style={isCurrent ? { backgroundColor: cfg.bg } : { backgroundColor: "#f1f5f9" }}
              >
                <span className={isCurrent ? "" : "grayscale"}>{cfg.icon}</span>
              </div>
              <span
                className="text-xs font-medium whitespace-nowrap"
                style={isCurrent ? { color: cfg.color, fontWeight: 700 } : { color: "#94a3b8" }}
              >
                {cfg.label}
              </span>
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-10 pointer-events-none">
                <div className="bg-slate-800 text-white text-xs rounded-lg px-3 py-2 max-w-[160px] text-center shadow-lg">
                  {TOOLTIPS[key]}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
