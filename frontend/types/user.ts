// Mirrors `backend/app/models/enums.py` and `backend/app/schemas/user.py`.
// No codegen in this project — these are kept in sync by hand, which is fine
// at this size (one small, slow-changing set of enums) and avoids adding a
// build step for a one-week project.

export type Gender = "male" | "female" | "other";

export type FitnessGoal =
  | "weight_loss"
  | "muscle_gain"
  | "maintenance"
  | "general_fitness";

export type ActivityLevel =
  | "sedentary"
  | "lightly_active"
  | "moderately_active"
  | "very_active"
  | "extra_active";

export type WorkoutExperience = "beginner" | "intermediate" | "advanced";

export type DietPreference = "vegetarian" | "non_vegetarian" | "vegan";

export type Equipment =
  | "none"
  | "dumbbells"
  | "barbell"
  | "resistance_bands"
  | "pull_up_bar"
  | "full_gym";

export interface ProfileResponse {
  name: string;
  age: number;
  gender: Gender;
  height_cm: number;
  weight_kg: number;
  fitness_goal: FitnessGoal;
  activity_level: ActivityLevel;
  workout_experience: WorkoutExperience;
  equipment_available: Equipment[];
  diet_preference: DietPreference;
}

export interface ProfileMetrics {
  bmi: number;
  bmi_category: "underweight" | "normal" | "overweight" | "obese";
  daily_calories: number;
}

export interface UserResponse {
  id: string;
  email: string;
  created_at: string;
  profile: ProfileResponse | null;
  metrics: ProfileMetrics | null;
}

export interface AuthResponse {
  user: UserResponse;
  access_token: string;
  token_type: string;
}
