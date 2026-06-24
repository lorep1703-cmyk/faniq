const TIERS = {
  ambassador: {
    icon: "🤝",
    label: "Porta spesso altri allo stadio",
    short: "Porta altri",
    color: "#8b5cf6",
    bg: "#f5f3ff",
  },
  social: {
    icon: "👥",
    label: "Viene occasionalmente con altri",
    short: "Viene con altri",
    color: "#3b82f6",
    bg: "#eff6ff",
  },
  solo: {
    icon: "🧍",
    label: "Viene principalmente da solo",
    short: "Fan solo",
    color: "#94a3b8",
    bg: "#f8fafc",
  },
};

function getTier(score) {
  if (score == null) return null;
  if (score > 60) return "ambassador";
  if (score >= 30) return "social";
  return "solo";
}

const SIZE = {
  sm: { px: "px-2 py-0.5", text: "text-xs" },
  md: { px: "px-2.5 py-1", text: "text-sm" },
  lg: { px: "px-3 py-1.5", text: "text-sm font-semibold" },
};

export default function AmbassadorBadge({ score, size = "md" }) {
  const sz = SIZE[size] || SIZE.md;
  const tierKey = getTier(score);

  if (tierKey === null) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full ${sz.px} ${sz.text} font-medium bg-slate-100 text-slate-400`}
      >
        — N/D
      </span>
    );
  }

  const tier = TIERS[tierKey];

  if (size === "sm") {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full ${sz.px} ${sz.text} font-medium`}
        style={{ backgroundColor: tier.bg, color: tier.color }}
      >
        <span>{tier.icon}</span>
        <span>{score}</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full ${sz.px} ${sz.text} font-medium`}
      style={{ backgroundColor: tier.bg, color: tier.color }}
    >
      <span>{tier.icon}</span>
      <span>
        {tier.short} ({score})
      </span>
    </span>
  );
}

export { getTier, TIERS };
