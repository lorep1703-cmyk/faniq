import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle, Info, Lightbulb, TrendingUp } from "lucide-react";
import { fetchInsights, fetchStats } from "../api/client";
import DataHealthPill from "../components/DataHealthPill";
import EmptyState from "../components/EmptyState";

const TYPE_ICON = {
  warning: AlertTriangle,
  alert: AlertTriangle,
  success: CheckCircle,
  info: Info,
  opportunity: TrendingUp,
};

const TYPE_STYLE = {
  warning: "border-amber-200 bg-amber-50",
  alert: "border-red-200 bg-red-50",
  success: "border-emerald-200 bg-emerald-50",
  info: "border-blue-200 bg-blue-50",
  opportunity: "border-primary-200 bg-primary-50",
};

export default function Insights() {
  const [data, setData] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([fetchInsights(), fetchStats()])
      .then(([insights, s]) => {
        setData(insights);
        setStats(s);
      })
      .catch(() => setError("Impossibile caricare gli insights"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!stats?.total_fans) {
    return (
      <EmptyState
        title="Intelligence in attesa di dati"
        subtitle="Carica i CSV di abbonati, biglietteria e shop per ricevere insights automatici sui tuoi tifosi."
      />
    );
  }

  return (
    <div className="flex-1 p-8 overflow-auto">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Lightbulb size={24} className="text-primary-600" />
            Intelligence
          </h1>
          <p className="text-slate-500 text-sm mt-1">{data?.summary}</p>
        </div>
        <DataHealthPill />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data?.insights?.map((insight, i) => {
          const Icon = TYPE_ICON[insight.type] || Info;
          const style = TYPE_STYLE[insight.type] || TYPE_STYLE.info;
          return (
            <div key={i} className={`rounded-xl border p-5 ${style}`}>
              <div className="flex items-start gap-3">
                <Icon size={20} className="text-slate-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-slate-800">{insight.title}</h3>
                  <p className="text-sm text-slate-600 mt-1 leading-relaxed">{insight.body}</p>
                  <span className="text-xs text-slate-400 mt-2 inline-block">
                    Priorità: {insight.priority}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {data?.segment_counts && (
        <div className="mt-8 bg-white rounded-xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-slate-700 mb-4">Distribuzione segmenti</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {Object.entries(data.segment_counts).map(([seg, count]) => (
              <div key={seg} className="bg-slate-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-primary-600">{count}</p>
                <p className="text-xs text-slate-500 mt-1">{seg}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
