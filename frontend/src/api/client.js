import axios from "axios";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("faniq_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("faniq_token");
      localStorage.removeItem("faniq_club");
      window.location.href = "/login";
    } else if (error.code === "ECONNABORTED") {
      error.userMessage = "Il server impiega troppo tempo a rispondere. Riprova.";
    } else if (!error.response) {
      error.userMessage = "Backend non raggiungibile. Verifica che sia avviato su " + API_URL;
    } else {
      error.userMessage = error.response.data?.detail || `Errore del server (${error.response.status})`;
    }
    return Promise.reject(error);
  }
);

export const fetchStats = () => api.get("/dashboard/stats").then((r) => r.data);
export const fetchCitta = () => api.get("/dashboard/citta").then((r) => r.data);
export const fetchPresenze = () => api.get("/dashboard/presenze").then((r) => r.data);
export const fetchRevenueBreakdown = () => api.get("/dashboard/revenue-breakdown").then((r) => r.data);
export const fetchRetention = () => api.get("/dashboard/retention").then((r) => r.data);
export const fetchSegments = () => api.get("/dashboard/segments").then((r) => r.data);
export const fetchTopSpenders = () => api.get("/dashboard/top-spenders").then((r) => r.data);
export const fetchCrossSource = () => api.get("/dashboard/cross-source").then((r) => r.data);
export const fetchSeasons = () => api.get("/dashboard/seasons").then((r) => r.data);
export const fetchAllFans = () => api.get("/dashboard/fans").then((r) => r.data);
export const fetchInsights = () => api.get("/insights/overview").then((r) => r.data);
export const fetchDataReadiness = () => api.get("/insights/data-readiness").then((r) => r.data);

export const fetchSuggestedBase = () => api.get("/simulate/base").then((r) => r.data);
export const fetchAttendance = (params) =>
  api.get("/simulate/attendance", { params }).then((r) => r.data);
export const fetchFanDetail = (id) => api.get(`/insights/fan/${id}`).then((r) => r.data);
export const fetchHealth = () => api.get("/health", { timeout: 4000 }).then((r) => r.data);

export const uploadCsv = (type, file) => {
  const form = new FormData();
  form.append("file", file);
  return api.post(`/upload/${type}`, form, { timeout: 60000 }).then((r) => r.data);
};

export const downloadTemplate = (type) => {
  const token = localStorage.getItem("faniq_token");
  return api.get(`/upload/template/${type}`, {
    responseType: "blob",
    headers: { Authorization: `Bearer ${token}` },
  }).then((r) => {
    const url = URL.createObjectURL(r.data);
    const a = document.createElement("a");
    a.href = url;
    a.download = `template_${type}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  });
};
export const fetchUploadHistory = () => api.get("/upload/history").then((r) => r.data);
export const undoUpload = (id) => api.delete(`/upload/${id}`).then((r) => r.data);

export const fetchConsentSummary = () => api.get("/privacy/consent-summary").then((r) => r.data);
export const fetchFanGdprData = (id) => api.get(`/privacy/fan/${id}/export`).then((r) => r.data);
export const deleteFanGdpr = (id) => api.delete(`/privacy/fan/${id}`).then((r) => r.data);
export const updateFanConsent = (id, tipo, consenso) =>
  api.patch(`/privacy/fan/${id}/consent`, { tipo, consenso }).then((r) => r.data);
export const fetchDataRetention = () => api.get(`/privacy/retention`).then((r) => r.data);
export const fetchPrivacyLog = (limit = 20) =>
  api.get(`/privacy/log?limit=${limit}`).then((r) => r.data);

export const exportFans = (segment = "tutti", soloConsenzienti = false) => {
  return api
    .get("/export/fans", {
      params: { segment, solo_consenzienti: soloConsenzienti },
      responseType: "blob",
    })
    .then((r) => {
      const url = URL.createObjectURL(r.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `faniq_${segment}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    });
};

export const sendChat = (messages) =>
  api.post("/chat/", { messages }).then((r) => r.data);
