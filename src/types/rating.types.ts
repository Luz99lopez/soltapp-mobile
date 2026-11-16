export interface RatingReviewerProfile {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  created_at?: string;
}

export interface UserRating {
  id: string;
  reviewer_id: string;
  target_user_id: string;
  rating: number; // 1 to 5
  comment: string | null;
  created_at: string;
  updated_at: string;
  reviewer?: RatingReviewerProfile | null;
}

export interface RatingDistributionItem {
  count: number;
  percent: number;
}

export interface RatingSummary {
  target_user_id: string;
  total_ratings: number;
  average_rating: number; // Rounded to 1 decimal place (e.g. 4.8)
  distribution: {
    5: RatingDistributionItem;
    4: RatingDistributionItem;
    3: RatingDistributionItem;
    2: RatingDistributionItem;
    1: RatingDistributionItem;
  };
}

export interface RatingEligibility {
  can_rate: boolean;
  reason?: string | null;
  has_rated_before?: boolean;
  existing_rating?: {
    rating: number;
    comment: string | null;
    updated_at: string;
  } | null;
  seconds_since_update?: number | null;
}

export interface UpsertRatingInput {
  target_user_id: string;
  rating: number;
  comment?: string | null;
}

export interface PaginatedRatingsResponse {
  target_user_id: string;
  total: number;
  limit: number;
  offset: number;
  items: UserRating[];
}
