import axios from 'axios';
import type {
  LoginRequest,
  RegisterRequest,
  TokenResponse,
  User,
  Ride,
  RideCreate,
  Workout,
  WorkoutCreate,
  NutritionLog,
  Goal,
  GoalCreate,
  TrainerRequest,
  TrainerRequestCreate,
  TrainerAssignment,
  TrainingPlan,
  TrainingPlanSummary,
  TrainingPlanCreate,
  PlannedWorkoutCreate,
  PlannedGoalCreate,
  NutritionPlanCreate,
  TrainingDocument,
  SystemStats,
  UserRole,
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

  create: async (data: WorkoutCreate): Promise<Workout> => {
    const response = await api.post<Workout>('/workouts/', data);
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

  create: async (data: GoalCreate): Promise<Goal> => {
    const response = await api.post<Goal>('/goals/', data);
    return response.data;
  },
};

export const trainerAthleteAPI = {
  sendRequest: async (trainerId: number, message?: string): Promise<TrainerRequest> => {
    const data: TrainerRequestCreate = { trainer_id: trainerId, message };
    const response = await api.post<TrainerRequest>('/trainer-requests/', data);
    return response.data;
  },

  getRequests: async (): Promise<TrainerRequest[]> => {
    const response = await api.get<TrainerRequest[]>('/trainer-requests/');
    return response.data;
  },

  respondToRequest: async (requestId: number, approve: boolean): Promise<TrainerRequest> => {
    const response = await api.put<TrainerRequest>(`/trainer-requests/${requestId}/respond`, { approve });
    return response.data;
  },

  getAssignments: async (): Promise<TrainerAssignment[]> => {
    const response = await api.get<TrainerAssignment[]>('/trainer-requests/assignments');
    return response.data;
  },

  deleteAssignment: async (assignmentId: number): Promise<void> => {
    await api.delete(`/trainer-requests/assignments/${assignmentId}`);
  },

  searchTrainers: async (query: string): Promise<User[]> => {
    const response = await api.get<User[]>('/trainer-requests/trainers/search', { params: { q: query } });
    return response.data;
  },

  getMyAthletes: async (): Promise<User[]> => {
    const response = await api.get<User[]>('/trainer-requests/my-athletes');
    return response.data;
  },
};

export const trainingPlansAPI = {
  getAll: async (): Promise<TrainingPlanSummary[]> => {
    const response = await api.get<TrainingPlanSummary[]>('/training-plans/');
    return response.data;
  },

  getById: async (id: number): Promise<TrainingPlan> => {
    const response = await api.get<TrainingPlan>(`/training-plans/${id}`);
    return response.data;
  },

  create: async (data: TrainingPlanCreate): Promise<TrainingPlan> => {
    const response = await api.post<TrainingPlan>('/training-plans/', data);
    return response.data;
  },

  update: async (id: number, data: Partial<TrainingPlanCreate>): Promise<TrainingPlan> => {
    const response = await api.put<TrainingPlan>(`/training-plans/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/training-plans/${id}`);
  },

  addWorkout: async (planId: number, data: PlannedWorkoutCreate): Promise<void> => {
    await api.post(`/training-plans/${planId}/workouts`, data);
  },

  updateWorkout: async (planId: number, workoutId: number, data: any): Promise<void> => {
    await api.put(`/training-plans/${planId}/workouts/${workoutId}`, data);
  },

  deleteWorkout: async (planId: number, workoutId: number): Promise<void> => {
    await api.delete(`/training-plans/${planId}/workouts/${workoutId}`);
  },

  addGoal: async (planId: number, data: PlannedGoalCreate): Promise<void> => {
    await api.post(`/training-plans/${planId}/goals`, data);
  },

  updateGoal: async (planId: number, goalId: number, data: any): Promise<void> => {
    await api.put(`/training-plans/${planId}/goals/${goalId}`, data);
  },

  deleteGoal: async (planId: number, goalId: number): Promise<void> => {
    await api.delete(`/training-plans/${planId}/goals/${goalId}`);
  },

  addNutrition: async (planId: number, data: NutritionPlanCreate): Promise<void> => {
    await api.post(`/training-plans/${planId}/nutrition`, data);
  },

  updateNutrition: async (planId: number, nutritionId: number, data: any): Promise<void> => {
    await api.put(`/training-plans/${planId}/nutrition/${nutritionId}`, data);
  },

  deleteNutrition: async (planId: number, nutritionId: number): Promise<void> => {
    await api.delete(`/training-plans/${planId}/nutrition/${nutritionId}`);
  },

  uploadDocument: async (planId: number, file: File, description?: string): Promise<TrainingDocument> => {
    const formData = new FormData();
    formData.append('file', file);
    if (description) formData.append('description', description);
    const response = await api.post<TrainingDocument>(`/training-plans/${planId}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  downloadDocument: async (planId: number, docId: number): Promise<Blob> => {
    const response = await api.get(`/training-plans/${planId}/documents/${docId}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  deleteDocument: async (planId: number, docId: number): Promise<void> => {
    await api.delete(`/training-plans/${planId}/documents/${docId}`);
  },
};

export const adminAPI = {
  getUsers: async (skip: number = 0, limit: number = 100, role?: UserRole): Promise<User[]> => {
    const params: any = { skip, limit };
    if (role) params.role = role;
    const response = await api.get<User[]>('/admin/users', { params });
    return response.data;
  },

  getUserById: async (userId: number): Promise<User> => {
    const response = await api.get<User>(`/admin/users/${userId}`);
    return response.data;
  },

  changeUserRole: async (userId: number, role: UserRole): Promise<User> => {
    const response = await api.put<User>(`/admin/users/${userId}/role`, { role });
    return response.data;
  },

  lockUser: async (userId: number, locked: boolean): Promise<User> => {
    const response = await api.put<User>(`/admin/users/${userId}/lock`, { locked });
    return response.data;
  },

  deleteUser: async (userId: number): Promise<void> => {
    await api.delete(`/admin/users/${userId}`);
  },

  getAssignments: async (activeOnly: boolean = true): Promise<TrainerAssignment[]> => {
    const response = await api.get<TrainerAssignment[]>('/admin/assignments', { params: { active_only: activeOnly } });
    return response.data;
  },

  createAssignment: async (trainerId: number, athleteId: number, notes?: string): Promise<TrainerAssignment> => {
    const response = await api.post<TrainerAssignment>('/admin/assignments', { trainer_id: trainerId, athlete_id: athleteId, notes });
    return response.data;
  },

  deleteAssignment: async (assignmentId: number): Promise<void> => {
    await api.delete(`/admin/assignments/${assignmentId}`);
  },

  getStats: async (): Promise<SystemStats> => {
    const response = await api.get<SystemStats>('/admin/stats');
    return response.data;
  },
};

export default api;
