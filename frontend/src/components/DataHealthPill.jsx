import { useEffect, useState } from "react";
import { Gauge } from "lucide-react";
import { fetchDataReadiness } from "../api/client";
import DataHealthModal from "./DataHealthModal";

/**
 * Badge compatto "Affidabilità dati" col solo punteggio.
 * Identico su Intelligence e Report; al clic apre il pannello unico col dettaglio.
 */
export default function DataHealthPill() {
  const [data, setData] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchDataReadiness().then(setData).catch(() => {});
  }, []);

  if (!data) return null;

  const dot = data.score >= 80 ? "bg-emerald-500" : data.score >= 50 ? "bg-amber-400" : "bg-red-500";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-white border border-slate-200 hover:border-primary-300 rounded-xl px-3.5 py-2.5 transition-colors shadow-sm"
        title="Quanto sono completi i tuoi dati"
      >
        <Gauge size={16} className="text-slate-400" />
        <span className="text-sm font-semibold text-slate-600">Affidabilità dati</span>
        <span className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${dot}`} />
          <span className="text-sm font-bold text-slate-800">{data.score}%</span>
        </span>
      </button>
      <DataHealthModal open={open} onClose={() => setOpen(false)} data={data} />
    </>
  );
}
