import axios from "axios";

const resolvedBaseUrl =
  import.meta.env.VITE_API_BASE_URL?.trim() || "http://localhost:8000";

const api = axios.create({
  baseURL: resolvedBaseUrl,
  timeout: 10000,
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
  storeResults = false,
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

export default api;
