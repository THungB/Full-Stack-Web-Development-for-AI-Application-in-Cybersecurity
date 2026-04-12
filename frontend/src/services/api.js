import axios from "axios";

const resolvedBaseUrl =
  import.meta.env.VITE_API_BASE_URL?.trim() || "http://localhost:8000";

const api = axios.create({
  baseURL: resolvedBaseUrl,
  timeout: 50000,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API error:", error.response?.data || error.message);
    return Promise.reject(error);
  },
);

export const scanMessage = (message, source = "website") =>
  api.post("/scan", { message, source });

export const scanOcr = (formData) =>
  api.post("/scan/ocr", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const scanBatch = ({
  file,
  storeResults = true,
  defaultSource = "batch",
}) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("store_results", String(storeResults));
  formData.append("default_source", defaultSource);

  return api.post("/scan/batch", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const getHistory = (page = 1, limit = 20, filter = "", source = "") =>
  api.get("/history", {
    params: {
      page,
      limit,
      filter,
      source,
    },
  });

export const getStats = () => api.get("/stats");

export const getHealth = () => api.get("/health");

export const deleteRecord = (id) => api.delete(`/history/${id}`);
export const regenerateLabel = (id) => api.post(`/history/${id}/regenerate-label`);

export default api;

export const getTelegramMessages = (page = 1, limit = 20, filter = "") =>
  api.get("/telegram/messages", {
    params: {
      page,
      limit,
      filter,
    },
  });

export const deleteTelegramRecord = (id) =>
  api.delete(`/telegram/messages/${id}`);

export const getTelegramSpammers = () => api.get("/telegram/spammers");

export const getTelegramSettings = () => api.get("/telegram/settings");

export const updateTelegramSettings = (payload) =>
  api.put("/telegram/settings", payload);

export const manualTelegramBan = (payload) => api.post("/telegram/ban", payload);

export const manualTelegramUnban = (payload) => api.post("/telegram/unban", payload);

export const getTelegramTrafficReport = (sourceScope = "all") =>
  api.get("/telegram/traffic-report", {
    params: { source_scope: sourceScope },
  });
