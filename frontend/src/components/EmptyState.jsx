import { useNavigate } from "react-router-dom";
import { Upload, Sparkles } from "lucide-react";

/**
 * Schermata di benvenuto per un club senza dati: un solo invito chiaro.
 * Niente grafici vuoti — la prima cosa che vedi è cosa fare.
 */
export default function EmptyState({ title, subtitle }) {
  const navigate = useNavigate();
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-5">
          <Sparkles size={30} className="text-primary-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">{title}</h2>
        <p className="text-slate-500 text-sm leading-relaxed mb-6">{subtitle}</p>
        <button
          onClick={() => navigate("/upload")}
          className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors shadow-sm"
        >
          <Upload size={18} />
          Carica i tuoi dati
        </button>
        <p className="text-xs text-slate-400 mt-4">
          Non sai da dove iniziare? Scarica un modello, riempilo e ricaricalo.
        </p>
      </div>
    </div>
  );
}
