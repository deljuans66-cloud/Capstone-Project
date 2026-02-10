import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/auth";
    }
    return Promise.reject(error);
  },
);

export const authApi = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  logout: () => api.post("/auth/logout"),
};

export const platformApi = {
  getAll: () => api.get("/platforms"),
  getOne: (id) => api.get(`/platforms/${id}`),
};

export const gameApi = {
  getByPlatform: (platformId) => api.get(`/games?platform_id=${platformId}`),
  getOne: (id) => api.get(`/games/${id}`),
};

export const groupApi = {
  getByGame: (gameId) => api.get(`/groups?game_id=${gameId}`),
  getOne: (id) => api.get(`/groups/${id}`),
  create: (data) => api.post("/groups", data),
  update: (id, data) => api.put(`/groups/${id}`, data),
  delete: (id) => api.delete(`/groups/${id}`),
  join: (id) => api.post(`/groups/${id}/join`),
  leave: (id) => api.post(`/groups/${id}/leave`),
  getMembers: (id) => api.get(`/groups/${id}/members`),
};

export const messageApi = {
  getByGroup: (groupId) => api.get(`/messages?group_id=${groupId}`),
  create: (data) => api.post("/messages", data),
};

export const userApi = {
  getOne: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.put(`/users/${id}`, data),
  getMe: () => api.get("/users/me/profile"),
};

export default api;
