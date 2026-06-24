const STAGE_CONFIG = {
  SCOPERTA:   { label: "Scoperta",   icon: "🌱", color: "#6366f1", bg: "#eef2ff" },
  ABITUDINE:  { label: "Abitudine",  icon: "📈", color: "#3b82f6", bg: "#eff6ff" },
  FEDELTA:    { label: "Fedeltà",    icon: "💪", color: "#10b981", bg: "#ecfdf5" },
  PICCO:      { label: "Picco",      icon: "⭐", color: "#f59e0b", bg: "#fffbeb" },
  RISCHIO:    { label: "A rischio",  icon: "⚠️", color: "#f97316", bg: "#fff7ed" },
  DORMIENTE:  { label: "Dormiente",  icon: "😴", color: "#94a3b8", bg: "#f8fafc" },
  RECUPERATO: { label: "Recuperato", icon: "🔄", color: "#8b5cf6", bg: "#f5f3ff" },
};

const SIZE = {
  sm: { px: "px-2 py-0.5", text: "text-xs", dot: "w-1.5 h-1.5" },
  md: { px: "px-2.5 py-1", text: "text-sm", dot: "w-2 h-2" },
  lg: { px: "px-3 py-1.5", text: "text-sm font-semibold", dot: "w-2.5 h-2.5" },
};

export default function JourneyBadge({ stage, size = "md" }) {
  const cfg = stage ? STAGE_CONFIG[stage.toUpperCase()] : null;
  const sz = SIZE[size] || SIZE.md;

  if (!cfg) {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full ${sz.px} ${sz.text} bg-slate-100 text-slate-400 font-medium`}>
        <span className={`rounded-full bg-slate-300 ${sz.dot}`} />
        N/D
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full ${sz.px} ${sz.text} font-medium`}
      style={{ backgroundColor: cfg.bg, color: cfg.color }}
    >
      <span className="leading-none">{cfg.icon}</span>
      {cfg.label}
    </span>
  );
}

export { STAGE_CONFIG };
