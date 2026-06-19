import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Upload, Users, FileBarChart2, Lightbulb, ShieldCheck, FlaskConical, LogOut, CalendarDays } from "lucide-react";

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/insights", label: "Intelligence", icon: Lightbulb },
  { to: "/calendario", label: "Calendario", icon: CalendarDays },
  { to: "/report", label: "Report & Segmenti", icon: FileBarChart2 },
  { to: "/simulatore", label: "Simulatore", icon: FlaskConical },
  { to: "/upload", label: "Carica dati", icon: Upload },
  { to: "/privacy", label: "Privacy & GDPR", icon: ShieldCheck },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const club = (() => {
    try { return JSON.parse(localStorage.getItem("faniq_club") || "{}"); }
    catch { return {}; }
  })();

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
