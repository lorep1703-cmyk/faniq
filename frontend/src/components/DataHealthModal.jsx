import { X, CheckCircle2, XCircle } from "lucide-react";

export default function DataHealthModal({ open, onClose, data }) {
  if (!open || !data) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-[fadeIn_0.2s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-800">Affidabilità dati</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X size={20} />
          </button>
        </div>

        <div className="text-center mb-6">
          <p className="text-4xl font-bold text-primary-600">{data.score}%</p>
          <p className="text-sm text-slate-500 mt-1">Punteggio di completezza</p>
        </div>

        <ul className="space-y-3">
          {data.checks?.map((check) => (
            <li key={check.label} className="flex items-start gap-3 text-sm">
              {check.ok ? (
                <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
              ) : (
                <XCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-medium text-slate-700">{check.label}</p>
                <p className="text-slate-400 text-xs">{check.detail}</p>
              </div>
            </li>
          ))}
        </ul>

        {data.sources && (
          <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <p className="font-bold text-slate-700">{data.sources.abbonati}</p>
              <p className="text-slate-400">Abbonati</p>
            </div>
            <div>
              <p className="font-bold text-slate-700">{data.sources.biglietteria}</p>
              <p className="text-slate-400">Biglietti</p>
            </div>
            <div>
              <p className="font-bold text-slate-700">{data.sources.shop}</p>
              <p className="text-slate-400">Shop</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
