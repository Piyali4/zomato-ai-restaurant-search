export type BudgetType = "low" | "medium" | "high";

export type Cuisine = "Bengali" | "Chinese" | "North Indian" | "South Indian";

export interface Restaurant {
  id: string;
  hotel_name: string;
  rating: number;
  address: string;
  area: string;
  restaurant_type: string[];
  budget_for_two: number;
  budget_type: BudgetType;
}

export interface UserPreferences {
  area?: string;
  budget?: BudgetType;
  cuisines?: string[];
  minRating?: number;
  notes?: string;
  topK?: number;
}

export interface Recommendation {
  id: string;
  rank: number;
  hotel_name: string;
  area: string;
  address: string;
  rating: number;
  budget_for_two: number;
  budget_type: BudgetType;
  restaurant_type: string[];
  explanation: string;
}

export interface RecommendResponse {
  total_matches: number;
  used_llm: boolean;
  recommendations: Recommendation[];
  summary?: string;
  filters_used: UserPreferences;
}
