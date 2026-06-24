const SEVERITY_CFG = {
  CRITICA: { icon: "🚨", border: "border-red-400",    bg: "bg-red-50",    text: "text-red-800" },
  ALTA:    { icon: "⚠️", border: "border-orange-400", bg: "bg-orange-50", text: "text-orange-800" },
  MEDIA:   { icon: "📉", border: "border-yellow-400", bg: "bg-yellow-50", text: "text-yellow-800" },
  BASSA:   { icon: "ℹ️", border: "border-slate-300",  bg: "bg-slate-50",  text: "text-slate-700" },
};

/**
 * Banner inline da mostrare in cima alla scheda fan.
 * Renderizza solo se anomaly != null — il chiamante non deve controllare.
 */
export default function FanAnomalyBanner({ anomaly }) {
  if (!anomaly) return null;

  const cfg = SEVERITY_CFG[anomaly.severity] ?? SEVERITY_CFG.BASSA;

  return (
    <div className={`flex items-start gap-3 rounded-xl border-l-4 px-4 py-3 mb-4 ${cfg.border} ${cfg.bg}`}>
      <span className="text-lg leading-none mt-0.5 shrink-0">{cfg.icon}</span>
      <p className={`text-sm font-medium leading-snug ${cfg.text}`}>{anomaly.message}</p>
    </div>
  );
}
