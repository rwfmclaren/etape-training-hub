import axios from 'axios';
import type {
  LoginRequest,
  RegisterRequest,
  TokenResponse,
  User,
  Ride,
  RideCreate,
  Workout,
  NutritionLog,
  Goal,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_V1 = `${API_BASE_URL}/api/v1`;

const api = axios.create({
  baseURL: API_V1,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: async (data: LoginRequest): Promise<TokenResponse> => {
    const formData = new FormData();
    formData.append('username', data.username);
    formData.append('password', data.password);
    const response = await api.post<TokenResponse>('/auth/login', formData);
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<User> => {
    const response = await api.post<User>('/auth/register', data);
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },
};

export const ridesAPI = {
  getAll: async (): Promise<Ride[]> => {
    const response = await api.get<Ride[]>('/rides/');
    return response.data;
  },

  getOne: async (id: number): Promise<Ride> => {
    const response = await api.get<Ride>(`/rides/${id}`);
    return response.data;
  },

  create: async (data: RideCreate): Promise<Ride> => {
    const response = await api.post<Ride>('/rides/', data);
    return response.data;
  },

  update: async (id: number, data: Partial<RideCreate>): Promise<Ride> => {
    const response = await api.put<Ride>(`/rides/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/rides/${id}`);
  },
};

export const workoutsAPI = {
  getAll: async (): Promise<Workout[]> => {
    const response = await api.get<Workout[]>('/workouts/');
    return response.data;
  },
};

export const nutritionAPI = {
  getAll: async (): Promise<NutritionLog[]> => {
    const response = await api.get<NutritionLog[]>('/nutrition/');
    return response.data;
  },
};

export const goalsAPI = {
  getAll: async (): Promise<Goal[]> => {
    const response = await api.get<Goal[]>('/goals/');
    return response.data;
  },
};

export default api;
