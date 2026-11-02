// Contrato v1 en el SQL único supabase/proposals/20261030_chat_persistence.sql, pendiente de aplicación.
export interface ChatConversation {
  id: string;
  product_id: string;
  buyer_id: string;
  seller_id: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  client_id: string;
  body: string;
  created_at: string;
}

export interface ChatProduct {
  id: string;
  seller_id: string;
  title: string;
  price: number;
  currency: string;
  images?: { image_url: string; position: number; is_cover: boolean }[];
}

export interface ChatContext {
  userId: string;
  productId: string;
  product: ChatProduct | null;
  counterpartName: string;
  conversation: ChatConversation | null;
}

export interface ChatInboxItem extends ChatConversation {
  product: ChatProduct | null;
  counterpartName: string;
  lastMessage: ChatMessage | null;
}

export interface ChatMessageCursor { created_at: string; id: string }
