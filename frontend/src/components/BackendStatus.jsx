import { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";
import { fetchHealth } from "../api/client";

/**
 * Banner che appare solo quando il backend non risponde.
 * Controlla /health all'avvio e poi ogni 30 secondi.
 */
export default function BackendStatus() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const check = () =>
      fetchHealth()
        .then(() => !cancelled && setOffline(false))
        .catch(() => !cancelled && setOffline(true));

    check();
    const interval = setInterval(check, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="bg-red-600 text-white text-sm font-medium px-4 py-2.5 flex items-center justify-center gap-2">
      <WifiOff size={15} />
      Backend non raggiungibile — riprova tra qualche secondo
    </div>
  );
}
