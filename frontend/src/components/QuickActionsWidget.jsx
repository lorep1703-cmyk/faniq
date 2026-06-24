import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Zap, AlertCircle, RefreshCw, Download, Upload, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { exportFans } from "../api/client";

const ACTIONS = [
  {
    label: "Vedi anomalie critiche",
    description: "Abbonati che non usano il posto",
    icon: AlertCircle,
    color: "#ef4444",
    type: "navigate",
    to: "/alerts",
  },
  {
    label: "Abbonati a rischio rinnovo",
    description: "Probabilità rinnovo < 50%",
    icon: RefreshCw,
    color: "#f97316",
    type: "navigate",
    to: "/report?filter=at_risk",
  },
  {
    label: "Esporta fan VIP",
    description: "CSV pronto per la campagna",
    icon: Download,
    color: "#8b5cf6",
    type: "export",
    segment: "VIP",
  },
  {
    label: "Carica nuovi dati",
    description: "Aggiorna abbonamenti, biglietti, shop",
    icon: Upload,
    color: "#3b82f6",
    type: "navigate",
    to: "/upload",
  },
];

export default function QuickActionsWidget() {
  const navigate = useNavigate();
  const [isExporting, setIsExporting] = useState(false);

  const handleAction = async (action) => {
    if (action.type === "navigate") {
      navigate(action.to);
    } else if (action.type === "export" && !isExporting) {
      setIsExporting(true);
      try {
        await exportFans(action.segment);
      } catch {
        // silenzio visivo — il browser non riceve il file ma non mostriamo errori
      } finally {
        setIsExporting(false);
      }
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Zap size={15} className="text-amber-500" />
        <h2 className="text-sm font-bold text-slate-700">Azioni rapide</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {ACTIONS.map((action) => {
          const isThis = action.type === "export";
          const disabled = isThis && isExporting;
          const Icon = (isThis && isExporting) ? Loader2 : action.icon;

          return (
            <motion.button
              key={action.label}
              whileHover={disabled ? {} : { scale: 1.01 }}
              onClick={() => handleAction(action)}
              disabled={disabled}
              className={`flex items-center gap-3 p-3 rounded-xl border border-slate-100
                hover:bg-slate-50 transition-colors w-full text-left
                ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${action.color}15` }}
              >
                <Icon
                  size={18}
                  style={{ color: action.color }}
                  className={isThis && isExporting ? "animate-spin" : ""}
                />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-700 leading-tight">
                  {action.label}
                </p>
                <p className="text-xs text-slate-400 mt-0.5 leading-tight">
                  {action.description}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
