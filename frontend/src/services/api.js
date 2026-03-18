import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
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

export const deleteRecord = (id) => api.delete(`/history/${id}`);

export default api;
