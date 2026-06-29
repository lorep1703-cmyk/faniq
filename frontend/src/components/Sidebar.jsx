import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Upload, Users, FileBarChart2, Lightbulb, ShieldCheck, LogOut, Bell, TrendingUp, Calendar } from "lucide-react";
import { fetchIntelligenceSummary } from "../api/client";

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/insights", label: "Intelligence", icon: Lightbulb },
  { to: "/report", label: "Report & Segmenti", icon: FileBarChart2 },
  { to: "/upload", label: "Carica dati", icon: Upload },
  { to: "/privacy", label: "Privacy & GDPR", icon: ShieldCheck },
  { to: "/simulatore", label: "Simulatore", icon: TrendingUp },
  { to: "/calendario", label: "Calendario", icon: Calendar },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const [criticalCount, setCriticalCount] = useState(0);

  const club = (() => {
    try { return JSON.parse(localStorage.getItem("faniq_club") || "{}"); }
    catch { return {}; }
  })();

  useEffect(() => {
    const token = localStorage.getItem("faniq_token");
    if (!token) return;
    fetchIntelligenceSummary()
      .then((data) => setCriticalCount(data.fans_critical_anomaly ?? 0))
      .catch(() => {/* badge non critico — fallisce silenziosamente */});
  }, []);

  function logout() {
    localStorage.removeItem("faniq_token");
    localStorage.removeItem("faniq_club");
    navigate("/login");
  }

  return (
    <aside className="w-60 min-h-screen bg-primary-600 flex flex-col">
      <div className="px-6 py-6 border-b border-primary-500">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <Users size={18} className="text-primary-600" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">FanIQ</span>
        </div>
        <p className="text-primary-200 text-xs mt-1 font-medium truncate">{club.nome || "—"}</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-white text-primary-600"
                  : "text-primary-100 hover:bg-primary-500 hover:text-white"
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}

        {/* Link "Da contattare" con badge anomalie critiche */}
        <NavLink
          to="/alerts"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? "bg-white text-primary-600"
                : "text-primary-100 hover:bg-primary-500 hover:text-white"
            }`
          }
        >
          <div className="relative">
            <Bell size={18} />
            {criticalCount > 0 && (
              <span className="absolute -top-2 -right-2 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
                {criticalCount > 99 ? "99+" : criticalCount}
              </span>
            )}
          </div>
          Da contattare
        </NavLink>
      </nav>

      <div className="px-4 py-4 border-t border-primary-500 space-y-2">
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-primary-200 hover:bg-primary-500 hover:text-white text-sm font-medium transition-colors"
        >
          <LogOut size={16} />
          Esci
        </button>
        <p className="text-primary-400 text-xs px-3">MVP v3.0</p>
      </div>
    </aside>
  );
}
