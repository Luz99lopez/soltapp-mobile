export type OrderStatus =
  | 'PENDING_MEETUP'
  | 'CANCELLED'
  | 'NO_SHOW'
  | 'DELIVERED'
  | 'COMPLETED';

export interface MeetupOrder {
  id: string;
  buyer_id: string;
  seller_id: string;
  product_id?: string | null;
  status: OrderStatus;
  qr_token?: string | null;
  qr_expires_at?: string | null;
  cancelled_by?: string | null;
  cancellation_reason?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
  product?: {
    id: string;
    title: string;
    price: string | number;
    images?: string[];
    condition?: string;
  } | null;
  seller?: {
    id: string;
    full_name?: string | null;
    avatar_url?: string | null;
  } | null;
  buyer?: {
    id: string;
    full_name?: string | null;
    avatar_url?: string | null;
  } | null;
}

export interface QRGenerationResult {
  order_id: string;
  qr_token: string;
  qr_expires_at: string;
}

export interface QRVerificationResult {
  success: boolean;
  order_id: string;
  status: OrderStatus;
  message?: string;
}

export interface PaymentConfirmationResult {
  success: boolean;
  order_id: string;
  status: OrderStatus;
  completed_at: string;
}

export interface OrderIssueResult {
  success: boolean;
  order_id: string;
  status: OrderStatus;
  cancelled_by: string;
  cancellation_reason?: string;
}

export interface OrderReviewResult {
  success: boolean;
  review_id: string;
  rating: number;
}
