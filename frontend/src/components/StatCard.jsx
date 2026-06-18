const COLOR_MAP = {
  primary: { bg: "bg-primary-50", icon: "text-primary-600", ring: "ring-primary-100" },
  green: { bg: "bg-emerald-50", icon: "text-emerald-600", ring: "ring-emerald-100" },
  amber: { bg: "bg-amber-50", icon: "text-amber-600", ring: "ring-amber-100" },
  blue: { bg: "bg-blue-50", icon: "text-blue-600", ring: "ring-blue-100" },
};

export default function StatCard({ label, value, sub, icon: Icon, color = "primary" }) {
  const c = COLOR_MAP[color] || COLOR_MAP.primary;

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
          {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl ${c.bg} ring-4 ${c.ring} flex items-center justify-center`}>
          <Icon size={20} className={c.icon} />
        </div>
      </div>
    </div>
  );
}
