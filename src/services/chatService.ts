import { supabase } from '../supabase';
import { productService } from './productService';
import { chatFailure, withChatTimeout } from '../utils/chatRequest';
import type { ChatContext, ChatConversation, ChatInboxItem, ChatMessage, ChatMessageCursor } from '../types/chat.types';

const PRODUCT_JOIN = 'product:products(id,seller_id,title,price,currency,images:product_images(image_url,position,is_cover))';
const PAGE_SIZE = 50;
function requireUuid(value: string, label: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) throw new Error(`${label} inválido.`);
}
function checkError(error: { code?: string; message?: string } | null, source: string) {
  if (!error) return;
  throw chatFailure(error, source);
}
async function requireUser() {
  let result;
  try { result = await withChatTimeout(supabase.auth.getUser()); }
  catch (reason) { throw chatFailure(reason, 'auth.getUser', true); }
  const { data: { user }, error } = result;
  if (error || !user) throw chatFailure(error, 'auth.getUser', true);
  return user;
}
async function counterpartName(userId: string, fallback: string) {
  const { data } = await withChatTimeout(supabase.from('users').select('full_name,username').eq('id', userId).maybeSingle()).catch(() => ({ data: null }));
  return data?.full_name || data?.username || fallback;
}

async function messagePage(conversationId: string, cursor: ChatMessageCursor | undefined, newer: boolean) {
  requireUuid(conversationId, 'Identificador de conversación');
  let query = supabase.from('chat_messages').select('*').eq('conversation_id', conversationId).order('created_at', { ascending: newer }).order('id', { ascending: newer }).limit(PAGE_SIZE);
  if (cursor) {
    requireUuid(cursor.id, 'Identificador de mensaje');
    if (!/^[0-9T:.+Z-]{20,35}$/.test(cursor.created_at) || !Number.isFinite(Date.parse(cursor.created_at))) throw new Error('Fecha de historial inválida.');
    const direction = newer ? 'gt' : 'lt';
    query = query.or(`created_at.${direction}.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.${direction}.${cursor.id})`);
  }
  const { data, error } = await withChatTimeout(query);
  checkError(error, 'chat_messages');
  const rows = (data || []) as ChatMessage[];
  return { messages: newer ? rows : rows.slice().reverse(), hasMore: rows.length === PAGE_SIZE };
}

export const chatService = {
  /** Abrir/leer nunca crea una conversación. El alta ocurre al enviar el primer mensaje. */
  async openContext(input: { conversationId?: string; productId?: string }): Promise<ChatContext> {
    const user = await requireUser();
    if (input.conversationId) {
      requireUuid(input.conversationId, 'Identificador de conversación');
      const { data, error } = await withChatTimeout(supabase.from('chat_conversations').select(`*,${PRODUCT_JOIN}`).eq('id', input.conversationId).maybeSingle());
      checkError(error, 'chat_conversations');
      if (!data || (data.buyer_id !== user.id && data.seller_id !== user.id)) throw new Error('Conversación no encontrada o sin permiso de acceso.');
      const otherId = data.buyer_id === user.id ? data.seller_id : data.buyer_id;
      return { userId: user.id, productId: data.product_id, product: data.product || null, conversation: data, counterpartName: await counterpartName(otherId, data.buyer_id === user.id ? 'Vendedor' : 'Comprador') };
    }
    if (!input.productId) throw new Error('Abrí una conversación desde un producto o desde el Buzón.');
    requireUuid(input.productId, 'Identificador de producto');
    const product = await withChatTimeout(productService.getProductById(input.productId));
    if (!product) throw new Error('Publicación no disponible.');
    if (product.seller_id === user.id) throw new Error('Para responder a un comprador, abrí su conversación desde el Buzón.');
    const { data, error } = await withChatTimeout(supabase.from('chat_conversations').select('*').eq('product_id', product.id).eq('buyer_id', user.id).eq('seller_id', product.seller_id).maybeSingle());
    checkError(error, 'chat_conversations');
    if (!data && product.status !== 'activo') throw new Error('La publicación no está disponible para iniciar una conversación.');
    return { userId: user.id, productId: product.id, product, conversation: data, counterpartName: product.seller?.full_name || product.seller?.username || 'Vendedor' };
  },

  async getMessages(conversationId: string, before?: ChatMessageCursor) {
    return messagePage(conversationId, before, false);
  },

  /** Cursor confirmado por lectura, independiente de eventos sueltos de Realtime. */
  async getNewMessages(conversationId: string, after?: ChatMessageCursor) {
    return messagePage(conversationId, after, true);
  },

  async sendMessage(input: { productId: string; conversationId?: string; body: string; clientId: string }): Promise<{ conversation: ChatConversation; message: ChatMessage }> {
    const body = input.body.trim();
    if (!body || body.length > 4000) throw new Error('Escribí un mensaje de hasta 4000 caracteres.');
    if (input.clientId.length < 8 || input.clientId.length > 100) throw new Error('Identificador de envío inválido.');
    const user = await requireUser();
    let conversation: ChatConversation;
    if (input.conversationId) {
      requireUuid(input.conversationId, 'Identificador de conversación');
      const { data, error } = await withChatTimeout(supabase.from('chat_conversations').select('*').eq('id', input.conversationId).maybeSingle());
      checkError(error, 'chat_conversations');
      if (!data || (data.buyer_id !== user.id && data.seller_id !== user.id)) throw new Error('Conversación no encontrada o sin permiso de acceso.');
      conversation = data;
    } else {
      requireUuid(input.productId, 'Identificador de producto');
      const { data, error } = await withChatTimeout(supabase.rpc('chat_get_or_create_conversation', { p_product_id: input.productId }));
      checkError(error, 'chat_get_or_create_conversation');
      if (!data?.id || data.buyer_id !== user.id || data.product_id !== input.productId) throw new Error('No se pudo abrir la conversación.');
      conversation = data;
    }
    const { data, error } = await withChatTimeout(supabase.rpc('chat_send_message', { p_conversation_id: conversation.id, p_client_id: input.clientId, p_body: body }));
    checkError(error, 'chat_send_message');
    if (!data?.id || data.sender_id !== user.id || data.conversation_id !== conversation.id) throw new Error('No se pudo confirmar el envío. Reintentá sin cambiar el mensaje.');
    return { conversation, message: data };
  },

  async getInbox(offset = 0): Promise<{ userId: string; items: ChatInboxItem[]; hasMore: boolean }> {
    const user = await requireUser();
    const { data, error } = await withChatTimeout(supabase.from('chat_conversations')
      .select(`*,${PRODUCT_JOIN},last_messages:chat_messages(*)`)
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .order('updated_at', { ascending: false }).order('id', { ascending: false })
      .order('created_at', { referencedTable: 'last_messages', ascending: false })
      .order('id', { referencedTable: 'last_messages', ascending: false })
      .limit(1, { referencedTable: 'last_messages' }).range(offset, offset + PAGE_SIZE - 1));
    checkError(error, 'chat_conversations');
    const rows = data || [];
    const otherIds = [...new Set(rows.map((row: any) => row.buyer_id === user.id ? row.seller_id : row.buyer_id))] as string[];
    const profiles = otherIds.length ? await withChatTimeout(supabase.from('users').select('id,full_name,username').in('id', otherIds)).catch(() => ({ data: null })) : { data: [] };
    const items = rows.map((row: any) => {
      const otherId = row.buyer_id === user.id ? row.seller_id : row.buyer_id;
      const profile = profiles.data?.find((entry: any) => entry.id === otherId);
      return { ...row, product: row.product || null, counterpartName: profile?.full_name || profile?.username || (row.buyer_id === user.id ? 'Vendedor' : 'Comprador'), lastMessage: row.last_messages?.[0] || null } as ChatInboxItem;
    });
    return { userId: user.id, items, hasMore: rows.length === PAGE_SIZE };
  },

  subscribeMessages(conversationId: string, onMessage: (message: ChatMessage) => void, onStatus: (status: string) => void) {
    requireUuid(conversationId, 'Identificador de conversación');
    const channel = supabase.channel(`chat-messages:${conversationId}:${Date.now()}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `conversation_id=eq.${conversationId}` }, payload => {
        if (payload.new?.conversation_id === conversationId && payload.new?.id) onMessage(payload.new as ChatMessage);
      }).subscribe(status => onStatus(status));
    return () => { void supabase.removeChannel(channel); };
  },

  subscribeInbox(userId: string, onChange: () => void, onStatus?: (status: string) => void) {
    requireUuid(userId, 'Identificador de usuario');
    const channel = supabase.channel(`chat-inbox:${userId}:${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_conversations', filter: `buyer_id=eq.${userId}` }, onChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_conversations', filter: `seller_id=eq.${userId}` }, onChange)
      .subscribe(status => onStatus?.(status));
    return () => { void supabase.removeChannel(channel); };
  },
};
