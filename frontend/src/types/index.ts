export type UserRole = 'athlete' | 'trainer' | 'admin';

export interface User {
  id: number;
  email: string;
  full_name?: string;
  invite_token?: string;
  is_active: boolean;
  role: UserRole;
  is_locked: boolean;
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
  invite_token?: string;
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

// Trainer-Athlete Relationships
export interface TrainerRequest {
  id: number;
  athlete_id: number;
  trainer_id: number;
  status: 'pending' | 'approved' | 'rejected';
  message?: string;
  created_at: string;
  responded_at?: string;
}

export interface TrainerRequestCreate {
  trainer_id: number;
  message?: string;
}

export interface TrainerAssignment {
  id: number;
  trainer_id: number;
  athlete_id: number;
  assigned_at: string;
  is_active: boolean;
  notes?: string;
}

// Training Plans
export interface TrainingPlan {
  id: number;
  trainer_id: number;
  athlete_id: number;
  title: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  workouts?: PlannedWorkout[];
  goals?: PlannedGoal[];
  documents?: TrainingDocument[];
  nutrition_plans?: NutritionPlan[];
}

export interface TrainingPlanSummary {
  id: number;
  trainer_id: number;
  athlete_id: number;
  title: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TrainingPlanCreate {
  athlete_id: number;
  title: string;
  description?: string;
  start_date?: string;
  end_date?: string;
}

export interface PlannedWorkout {
  id: number;
  training_plan_id: number;
  title: string;
  workout_type: string;
  scheduled_date: string;
  duration_minutes?: number;
  description?: string;
  intensity?: string;
  exercises?: string;  // JSON string
  is_completed: boolean;
  completed_at?: string;
}

export interface PlannedWorkoutCreate {
  training_plan_id: number;
  title: string;
  workout_type: string;
  scheduled_date: string;
  duration_minutes?: number;
  description?: string;
  intensity?: string;
  exercises?: string;
}

export interface PlannedGoal {
  id: number;
  training_plan_id: number;
  title: string;
  goal_type: string;
  description?: string;
  target_value?: number;
  current_value?: number;
  unit?: string;
  target_date?: string;
  is_achieved: boolean;
}

export interface PlannedGoalCreate {
  training_plan_id: number;
  title: string;
  goal_type: string;
  description?: string;
  target_value?: number;
  current_value?: number;
  unit?: string;
  target_date?: string;
}

export interface TrainingDocument {
  id: number;
  training_plan_id: number;
  filename: string;
  file_path: string;
  file_type: string;
  uploaded_at: string;
  description?: string;
}

export interface NutritionPlan {
  id: number;
  training_plan_id: number;
  day_of_week?: string;
  meal_type: string;
  description?: string;
  calories?: number;
  protein_grams?: number;
  carbs_grams?: number;
  fat_grams?: number;
  notes?: string;
}

export interface NutritionPlanCreate {
  training_plan_id: number;
  day_of_week?: string;
  meal_type: string;
  description?: string;
  calories?: number;
  protein_grams?: number;
  carbs_grams?: number;
  fat_grams?: number;
  notes?: string;
}

// Admin
export interface SystemStats {
  total_users: number;
  total_athletes: number;
  total_trainers: number;
  total_admins: number;
  total_active_assignments: number;
  total_training_plans: number;
  total_rides: number;
  total_workouts: number;
  total_goals: number;
}

// Invite Tokens
export interface InviteToken {
  id: number;
  token: string;
  email?: string;
  role: UserRole;
  created_by_id: number;
  created_at: string;
  expires_at: string;
  used_at?: string;
  used_by_id?: number;
  is_active: boolean;
  is_valid: boolean;
}

export interface InviteTokenCreate {
  email?: string;
  role: UserRole;
  expires_in_days?: number;
}

export interface InviteTokenPublic {
  token: string;
  role: UserRole;
  email?: string;
  expires_at: string;
  is_valid: boolean;
}

export interface RegisterWithInviteRequest {
  email: string;
  password: string;
  full_name?: string;
  invite_token?: string;
}

export interface UserCreateRequest {
  email: string;
  password: string;
  full_name?: string;
  invite_token?: string;
}

// Messages
export interface Message {
  id: number;
  sender_id: number;
  recipient_id: number;
  content: string;
  is_read: boolean;
  created_at: string;
  read_at?: string;
}

export interface MessageWithUsers extends Message {
  sender_name?: string;
  sender_email: string;
  recipient_name?: string;
  recipient_email: string;
}

export interface Conversation {
  user_id: number;
  user_name?: string;
  user_email: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

export interface MessageCreate {
  recipient_id: number;
  content: string;
}
