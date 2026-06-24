import { Navigate, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import ErrorBoundary from "./components/ErrorBoundary";
import BackendStatus from "./components/BackendStatus";
import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import Report from "./pages/Report";
import Insights from "./pages/Insights";
import Privacy from "./pages/Privacy";
import Login from "./pages/Login";
import AlertsPage from "./pages/AlertsPage";
import ChatWidget from "./components/ChatWidget";

function PrivateRoute({ children }) {
  const token = localStorage.getItem("faniq_token");
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <PrivateRoute>
            <div className="flex min-h-screen">
              <Sidebar />
              <main className="flex-1 flex flex-col">
                <BackendStatus />
                <ErrorBoundary>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/insights" element={<Insights />} />
                    <Route path="/report" element={<Report />} />
                    <Route path="/upload" element={<Upload />} />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/alerts" element={<AlertsPage />} />
                  </Routes>
                </ErrorBoundary>
              </main>
              <ChatWidget />
            </div>
          </PrivateRoute>
        }
      />
    </Routes>
  );
}
