const PROFILES = {
  LENTO:    { icon: "🪨", label: "Solido",   color: "#10b981", bg: "#ecfdf5", desc: "Non molla facilmente. Resiste alle assenze." },
  MEDIO:    { icon: "📊", label: "Regolare", color: "#3b82f6", bg: "#eff6ff", desc: "Comportamento nella norma." },
  RAPIDO:   { icon: "⚡", label: "Reattivo", color: "#f59e0b", bg: "#fffbeb", desc: "Si perde e si recupera velocemente." },
  VOLATILE: { icon: "🌊", label: "Volatile", color: "#ef4444", bg: "#fef2f2", desc: "Ogni assenza è un rischio reale." },
};

const SIZE = {
  sm: { px: "px-2 py-0.5", text: "text-xs" },
  md: { px: "px-2.5 py-1", text: "text-sm" },
  lg: { px: "px-3 py-1.5", text: "text-sm font-semibold" },
};

export default function DecayBadge({ profile, size = "md" }) {
  const sz = SIZE[size] || SIZE.md;
  const cfg = profile ? PROFILES[profile.toUpperCase()] : null;

  if (!cfg) {
    return (
      <span
        title="Storico insufficiente (meno di 8 partite)"
        className={`inline-flex items-center gap-1.5 rounded-full ${sz.px} ${sz.text} font-medium bg-slate-100 text-slate-400`}
      >
        — N/D
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full ${sz.px} ${sz.text} font-medium`}
      style={{ backgroundColor: cfg.bg, color: cfg.color }}
    >
      <span>{cfg.icon}</span>
      <span>{cfg.label}</span>
    </span>
  );
}

export { PROFILES };
