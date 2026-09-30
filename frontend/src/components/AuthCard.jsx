import { Users } from "lucide-react";

/** Cornice delle pagine pubbliche di accesso (logo + card), come in Login. */
export default function AuthCard({ title, subtitle, children }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
            <Users size={22} className="text-white" />
          </div>
          <span className="text-2xl font-bold text-gray-900 tracking-tight">FanIQ</span>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
          {subtitle && <p className="text-sm text-gray-500 mt-1 mb-6">{subtitle}</p>}
          {children}
        </div>
      </div>
    </div>
  );
}
