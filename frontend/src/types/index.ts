export interface User {
  id: number;
  email: string;
  full_name?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name?: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface Ride {
  id: number;
  user_id: number;
  title: string;
  description?: string;
  distance_km: number;
  duration_minutes: number;
  elevation_gain_m?: number;
  avg_speed_kmh?: number;
  max_speed_kmh?: number;
  avg_power_watts?: number;
  avg_heart_rate?: number;
  max_heart_rate?: number;
  avg_cadence?: number;
  ride_date: string;
  route_name?: string;
  ride_type?: string;
  created_at: string;
  updated_at: string;
}

export interface RideCreate {
  title: string;
  description?: string;
  distance_km: number;
  duration_minutes: number;
  elevation_gain_m?: number;
  avg_speed_kmh?: number;
  max_speed_kmh?: number;
  avg_power_watts?: number;
  avg_heart_rate?: number;
  max_heart_rate?: number;
  avg_cadence?: number;
  ride_date: string;
  route_name?: string;
  ride_type?: string;
}

export interface Workout {
  id: number;
  user_id: number;
  title: string;
  description?: string;
  workout_type: string;
  duration_minutes: number;
  intensity?: string;
  notes?: string;
  workout_date: string;
  created_at: string;
  updated_at: string;
}

export interface NutritionLog {
  id: number;
  user_id: number;
  meal_type?: string;
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  water_ml?: number;
  description?: string;
  notes?: string;
  log_date: string;
  created_at: string;
  updated_at: string;
}

export interface Goal {
  id: number;
  user_id: number;
  title: string;
  description?: string;
  goal_type: string;
  target_value?: number;
  current_value?: number;
  unit?: string;
  target_date?: string;
  is_completed: boolean;
  completed_date?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkoutCreate {
  title: string;
  workout_type: string;
  duration_minutes: number;
  workout_date: string;
  description?: string;
  intensity?: string;
  notes?: string;
}

export interface GoalCreate {
  title: string;
  goal_type: string;
  description?: string;
  target_value?: number;
  current_value?: number;
  unit?: string;
  target_date?: string;
}
