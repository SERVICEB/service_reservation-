import axios from "axios";

/** 🔧 Création d'une instance Axios avec baseURL depuis .env ou localhost */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
});

/** 🔐 Ajout automatique du token dans les en-têtes Authorization */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/* ─────────────── RESIDENCES ─────────────── */

export const fetchResidences = async () => {
  const { data } = await api.get("/residences");
  return data;
};

export const getResidenceById = async (id) => {
  const { data } = await api.get(`/residences/${id}`);
  return data;
};

export const createResidence = async (formData) => {
  const { data } = await api.post("/residences", formData, {
    headers: {
      "Content-Type": "multipart/form-data", // 👈 nécessaire pour envoyer des fichiers
    },
  });
  return data;
};

export const updateResidence = async (id, formData) => {
  const { data } = await api.put(`/residences/${id}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data", // 👈 idem ici
    },
  });
  return data;
};

export const deleteResidence = async (id) => {
  const { data } = await api.delete(`/residences/${id}`);
  return data;
};

/* ─────────────── ANNONCES ─────────────── */

export const fetchAnnonces = async () => {
  const { data } = await api.get("/annonces");
  return data;
};

export const createAnnonce = async (formData) => {
  const { data } = await api.post("/annonces", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return data;
};

export const updateAnnonce = async (id, formData) => {
  const { data } = await api.put(`/annonces/${id}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return data;
};

export const deleteAnnonce = async (id) => {
  const { data } = await api.delete(`/annonces/${id}`);
  return data;
};

/* ─────────────── UTILISATEURS ─────────────── */

export const login = async (credentials) => {
  const { data } = await api.post("/auth/login", credentials);
  return data;
};

export const register = async (newUser) => {
  const { data } = await api.post("/auth/register", newUser);
  return data;
};

export const getUserProfile = async () => {
  const { data } = await api.get("/auth/profile");
  return data;
};

/* ─────────────── RÉSERVATIONS ─────────────── */

export const createReservation = async (payload) => {
  const { data } = await api.post("/reservations", payload);
  return data;
};

export const fetchReservations = async () => {
  const { data } = await api.get("/reservations");
  return data;
};

export const deleteReservation = async (id) => {
  const { data } = await api.delete(`/reservations/${id}`);
  return data;
};

/** 📦 Export de l'instance Axios si besoin d'appels custom */
export default api;
