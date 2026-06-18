import { Component } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("FanIQ ErrorBoundary:", error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-md text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={26} className="text-red-500" />
          </div>
          <h2 className="text-lg font-bold text-slate-800">Qualcosa è andato storto</h2>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">
            Si è verificato un errore imprevisto in questa sezione. Ricarica la pagina per riprovare.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-5 inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
          >
            <RefreshCw size={15} />
            Ricarica pagina
          </button>
          <p className="text-xs text-slate-400 mt-4 font-mono break-all">
            {String(this.state.error?.message || this.state.error)}
          </p>
        </div>
      </div>
    );
  }
}
