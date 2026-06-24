import DecayBadge from "./DecayBadge";

const CONTEXT = {
  VOLATILE: "Questo tifoso tende ad allontanarsi dopo ogni assenza. Contattalo entro la prima partita saltata.",
  RAPIDO:   "Si perde rapidamente ma si recupera anche in fretta. Reagisce bene alle campagne.",
  MEDIO:    "Comportamento standard. Nessuna urgenza particolare.",
  LENTO:    "Fan solido. Puoi permetterti di aspettare senza rischiare di perderlo.",
};

export default function FanDecayProfile({ profile }) {
  if (!profile) return null;

  const key = profile.toUpperCase();
  const sentence = CONTEXT[key];
  if (!sentence) return null;

  return (
    <div className="mt-5 pt-4 border-t border-slate-100">
      <h3 className="text-sm font-bold text-slate-700 mb-2">Profilo fedeltà</h3>
      <div className="mb-2">
        <DecayBadge profile={profile} size="lg" />
      </div>
      <p className="text-sm text-slate-500 leading-relaxed">{sentence}</p>
    </div>
  );
}
