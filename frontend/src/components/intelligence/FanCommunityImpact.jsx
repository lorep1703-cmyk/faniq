import { Info } from "lucide-react";
import AmbassadorBadge, { getTier, TIERS } from "./AmbassadorBadge";

const TIER_DESCRIPTION = {
  ambassador: "Questo tifoso tende ad acquistare biglietti in gruppo: porta spesso altre persone allo stadio. È un moltiplicatore naturale — consideralo per offerte che includano accompagnatori.",
  social: "Questo tifoso viene occasionalmente con altri. Non è un ambassador sistematico, ma ha già mostrato comportamenti di gruppo.",
  solo: "Questo tifoso acquista prevalentemente per sé. Potrebbe venire allo stadio in compagnia, ma non emerge un pattern di gruppo dai dati disponibili.",
};

export default function FanCommunityImpact({ score }) {
  if (score == null) return null;

  const tierKey = getTier(score);
  if (!tierKey) return null;

  const tier = TIERS[tierKey];

  return (
    <div className="mt-6 pt-5 border-t border-slate-100">
      <h3 className="text-sm font-bold text-slate-700 mb-3">Impatto comunitario</h3>

      <div className="flex items-start gap-4">
        <div className="flex-1">
          <div className="mb-2">
            <AmbassadorBadge score={score} size="lg" />
          </div>
          <p className="text-sm text-slate-500 leading-relaxed">
            {TIER_DESCRIPTION[tierKey]}
          </p>
        </div>

        <div
          className="shrink-0 w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
          style={{ backgroundColor: tier.bg }}
        >
          {tier.icon}
        </div>
      </div>

      <div className="mt-3 flex items-start gap-1.5 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2.5">
        <Info size={12} className="text-slate-400 mt-0.5 shrink-0" />
        <p className="text-xs text-slate-400 leading-relaxed">
          Calcolato in base agli acquisti di gruppo — potrebbe non essere accurato al 100%.
          Score: {score}/100.
        </p>
      </div>
    </div>
  );
}
