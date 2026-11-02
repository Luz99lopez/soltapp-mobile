import type { ChatMessage } from '../types/chat.types';

/** La respuesta de enviar, el historial y Realtime pueden contener la misma fila. */
export function mergeChatMessages(current: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] {
  const rows = new Map(current.map(message => [message.id, message]));
  incoming.forEach(message => rows.set(message.id, message));
  return [...rows.values()].sort((a, b) => {
    const milliseconds = Date.parse(a.created_at) - Date.parse(b.created_at);
    if (milliseconds) return milliseconds;
    // PostgreSQL conserva microsegundos; Realtime/REST pueden usar Z o +00:00.
    const fraction = (value: string) => (value.match(/\.(\d+)/)?.[1] || '').padEnd(6, '0').slice(3, 6);
    return fraction(a.created_at).localeCompare(fraction(b.created_at)) || a.id.localeCompare(b.id);
  });
}

/** Identificador de reintento, no credencial. Se conserva hasta confirmar el envío. */
export function createChatClientId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}
