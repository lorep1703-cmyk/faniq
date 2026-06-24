import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid,
} from "recharts";
import { Users, Mail, Euro, TrendingUp, TrendingDown, ShieldAlert, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import StatCard from "../components/StatCard";
import { fetchStats, fetchCitta, fetchPresenze, fetchRevenueBreakdown, fetchIntelligenceSummary, fetchRetention } from "../api/client";
import JourneyDistributionWidget from "../components/intelligence/JourneyDistributionWidget";
import AmbassadorsWidget from "../components/intelligence/AmbassadorsWidget";
import DecayDistributionWidget from "../components/intelligence/DecayDistributionWidget";
import RfmDistributionWidget from "../components/RfmDistributionWidget";
import TopSpendersWidget from "../components/TopSpendersWidget";
import QuickActionsWidget from "../components/QuickActionsWidget";

const COLORS = ["#534AB7", "#7F79D5", "#AAA6E3", "#D4D2F1", "#EEEDF9"];

// ── Intelligence Banner ───────────────────────────────────────────────────────

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.4, ease: "easeOut" },
  }),
};

function IntelligenceBanner({ summary, loading }) {
  const atRisk      = summary?.fans_at_risk       ?? null;
  const critical    = summary?.fans_critical_anomaly ?? null;
  const renewalAvg  = summary?.avg_renewal_probability ?? null;

  const renewalPct  = renewalAvg != null ? Math.round(renewalAvg * 100) : null;
  const renewalColor =
    renewalAvg == null    ? "primary"
    : renewalAvg >= 0.70  ? "green"
    : renewalAvg >= 0.50  ? "amber"
    : "red";

  const cards = [
    {
      label: "Tifosi da tenere d'occhio",
      value: loading ? "—" : atRisk != null ? atRisk : "N/D",
      icon: ShieldAlert,
      color: loading || !atRisk ? "primary" : "red",
      sub: loading ? "" : atRisk === 0 ? "Nessuna situazione critica" : "richiedono attenzione immediata",
    },
    {
      label: "Da contattare oggi",
      value: loading ? "—" : critical != null ? critical : "N/D",
      icon: AlertCircle,
      color: loading || !critical ? "primary" : "amber",
      sub: loading ? "" : critical === 0 ? "Nessun abbonato silenzioso" : "abbonati paganti non usano il posto",
    },
    {
      label: "Prob. media rinnovo",
      value: loading ? "—" : renewalPct != null ? `${renewalPct}%` : "N/D",
      icon: TrendingUp,
      color: loading ? "primary" : renewalColor,
      sub: "stima media di rinnovo abbonamenti",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          custom={i}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
        >
          <StatCard
            label={card.label}
            value={card.value}
            sub={card.sub}
            icon={card.icon}
            color={card.color}
          />
        </motion.div>
      ))}
    </div>
  );
}

// ── Season Chart ──────────────────────────────────────────────────────────────

function SeasonChart({ data, loading }) {
  const filtered = (data ?? []).filter((d) => d.stagione != null);

  let yoyLabel = null;
  let yoyColor = "text-slate-400";
  let YoyIcon  = null;

  if (!loading && filtered.length >= 2) {
    const last = filtered[filtered.length - 1].count;
    const prev = filtered[filtered.length - 2].count;
    if (prev > 0) {
      const delta = Math.round(((last - prev) / prev) * 100);
      if (delta > 0) {
        yoyLabel = `+${delta}% vs stagione precedente`;
        yoyColor = "text-emerald-600";
        YoyIcon  = TrendingUp;
      } else if (delta < 0) {
        yoyLabel = `${delta}% vs stagione precedente`;
        yoyColor = "text-red-500";
        YoyIcon  = TrendingDown;
      } else {
        yoyLabel = "Stabile rispetto alla stagione precedente";
      }
    }
  } else if (!loading && filtered.length === 1) {
    yoyLabel = "Prima stagione disponibile";
  }

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-slate-700">Abbonati per stagione</h2>
        {yoyLabel && (
          <p className={`text-xs mt-0.5 flex items-center gap-1 ${yoyColor}`}>
            {YoyIcon && <YoyIcon size={12} />}
            {yoyLabel}
          </p>
        )}
      </div>

      {loading && (
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-slate-100 rounded w-1/3" />
          <div className="h-40 bg-slate-100 rounded-lg" />
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <p className="text-sm font-semibold text-slate-500">Dati stagionali non disponibili</p>
          <p className="text-xs text-slate-400 mt-1">
            Assicurati che il CSV abbonamenti includa il campo &quot;stagione&quot;
          </p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={filtered}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="stagione" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v) => [v, "Abbonati"]} />
            <Bar dataKey="count" name="Abbonati" radius={[4, 4, 0, 0]}>
              {filtered.map((_, i) => (
                <Cell
                  key={i}
                  fill={i === filtered.length - 1 ? "#10b981" : "#534AB7"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

function fmt(n) {
  return new Intl.NumberFormat("it-IT").format(n);
}

function fmtEur(n) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}

export default function Dashboard() {
  const club = JSON.parse(localStorage.getItem("faniq_club") || "{}");
  const [stats, setStats] = useState(null);
  const [citta, setCitta] = useState([]);
  const [presenze, setPresenze] = useState([]);
  const [revenue, setRevenue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [intelligenceSummary, setIntelligenceSummary] = useState(null);
  const [intelligenceLoading, setIntelligenceLoading] = useState(true);
  const [retention, setRetention] = useState(null);
  const [retentionLoading, setRetentionLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchStats(), fetchCitta(), fetchPresenze(), fetchRevenueBreakdown()])
      .then(([s, c, p, r]) => {
        setStats(s);
        setCitta(c);
        setPresenze(p);
        setRevenue(r);
      })
      .catch((err) => setError(err.userMessage || err.message || "Impossibile caricare i dati. Riprova."))
      .finally(() => setLoading(false));

    Promise.allSettled([fetchIntelligenceSummary()])
      .then(([result]) => {
        if (result.status === "fulfilled") setIntelligenceSummary(result.value);
      })
      .finally(() => setIntelligenceLoading(false));

    Promise.allSettled([fetchRetention()])
      .then(([result]) => {
        if (result.status === "fulfilled") setRetention(result.value);
      })
      .finally(() => setRetentionLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Caricamento dati...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md text-center">
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  const emailPct = stats.total_fans > 0
    ? Math.round((stats.fans_with_email / stats.total_fans) * 100)
    : 0;

  return (
    <div className="flex-1 p-8 overflow-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Panoramica tifosi — {club.nome || "Il tuo club"}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Tifosi identificati"
          value={fmt(stats.total_fans)}
          sub="profili unici nel database"
          icon={Users}
          color="primary"
        />
        <StatCard
          label="Con email"
          value={fmt(stats.fans_with_email)}
          sub={`${emailPct}% del totale — contattabili`}
          icon={Mail}
          color="green"
        />
        <StatCard
          label="Spesa media"
          value={fmtEur(stats.spesa_media)}
          sub="per tifoso (tutte le fonti)"
          icon={Euro}
          color="amber"
        />
        <StatCard
          label="Revenue totale"
          value={fmtEur(stats.total_revenue)}
          sub="abbonamenti + biglietti + shop"
          icon={TrendingUp}
          color="blue"
        />
      </div>

      {/* Intelligence Banner */}
      <IntelligenceBanner summary={intelligenceSummary} loading={intelligenceLoading} />

      {/* RFM Distribution + Stagioni */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <RfmDistributionWidget />
        <SeasonChart data={retention} loading={retentionLoading} />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Distribuzione città */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-slate-700 mb-4">Top 5 città</h2>
          {citta.length === 0 ? (
            <p className="text-slate-400 text-sm">Nessun dato disponibile</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={citta} layout="vertical" margin={{ left: 8 }}>
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="citta" type="category" tick={{ fontSize: 12 }} width={90} />
                <Tooltip cursor={{ fill: "#EEEDF9" }} />
                <Bar dataKey="count" name="Tifosi" fill="#534AB7" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Revenue breakdown */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-slate-700 mb-4">Revenue per fonte</h2>
          {revenue.every((r) => r.importo === 0) ? (
            <p className="text-slate-400 text-sm">Nessun dato disponibile</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={revenue}
                  dataKey="importo"
                  nameKey="fonte"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ fonte, percent }) => `${fonte} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {revenue.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip formatter={(v) => fmtEur(v)} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Journey Distribution + Ambassadors + Decay */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <JourneyDistributionWidget />
        <AmbassadorsWidget />
        <DecayDistributionWidget />
      </div>

      {/* Top Spender + Azioni rapide */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <TopSpendersWidget />
        <QuickActionsWidget />
      </div>

      {/* Presenze per partita */}
      {presenze.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-slate-700 mb-4">Presenze per partita</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={presenze}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="data"
                tick={{ fontSize: 11 }}
                tickFormatter={(d) => new Date(d).toLocaleDateString("it-IT", { day: "2-digit", month: "short" })}
              />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip
                labelFormatter={(d) => new Date(d).toLocaleDateString("it-IT")}
                formatter={(v) => [v, "Presenze"]}
              />
              <Line
                type="monotone"
                dataKey="presenze"
                stroke="#534AB7"
                strokeWidth={2.5}
                dot={{ fill: "#534AB7", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
