import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useIsFocused } from 'expo-router';
import { supabase } from '../supabase';
import { chatService } from '../services/chatService';
import type { ChatContext, ChatMessage, ChatMessageCursor } from '../types/chat.types';
import { createChatClientId, mergeChatMessages } from '../utils/chatMessages';
import { createProductUserChangeListener } from '../utils/productAuthEvents';
import { isChatAuthError, isChatConnectionError, isRetryableChatError } from '../utils/chatRequest';

export function useChatThread(input: { conversationId?: string; productId?: string }) {
  const focused = useIsFocused();
  const [context, setContext] = useState<ChatContext | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasOlder, setHasOlder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [live, setLive] = useState(false);
  const [offline, setOffline] = useState(false);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [openRetryable, setOpenRetryable] = useState(false);
  const [revision, setRevision] = useState(0);
  const generation = useRef(0);
  const sendLock = useRef<symbol | null>(null);
  const attempt = useRef<{ body: string; clientId: string } | null>(null);
  const cursor = useRef<ChatMessageCursor | undefined>(undefined);
  const refreshRef = useRef<(() => void) | null>(null);
  const messageSync = useRef<{ initial: boolean; after?: ChatMessageCursor }>({ initial: true });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.addEventListener) return;
    const disconnected = () => setOffline(true);
    const connected = () => setOffline(false);
    if (typeof navigator !== 'undefined' && navigator.onLine === false) disconnected();
    window.addEventListener('offline', disconnected); window.addEventListener('online', connected);
    return () => { window.removeEventListener('offline', disconnected); window.removeEventListener('online', connected); };
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(createProductUserChangeListener(() => {
      generation.current++;
      attempt.current = null;
      setContext(null);
      setMessages([]);
      setRevision(value => value + 1);
    }));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => { attempt.current = null; }, [input.conversationId, input.productId]);

  useEffect(() => {
    let active = true;
    const scope = ++generation.current;
    sendLock.current = null;
    cursor.current = undefined;
    messageSync.current = { initial: true };
    setContext(null);
    setMessages([]);
    setHasOlder(false);
    setSending(false);
    setLoadingOlder(false);
    setLoading(true);
    setError(null);
    setSyncError(null);
    setLive(false); setNeedsLogin(false); setOpenRetryable(false);
    chatService.openContext(input).then(data => {
      if (!active || scope !== generation.current) return;
      setContext(data);
      setOffline(false);
      if (!data.conversation) setLoading(false);
    }).catch(reason => {
      if (active && scope === generation.current) { setError(reason instanceof Error ? reason.message : 'No se pudo abrir el chat.'); setLoading(false); setNeedsLogin(isChatAuthError(reason)); setOffline(isChatConnectionError(reason)); setOpenRetryable(isRetryableChatError(reason)); }
    });
    return () => { active = false; generation.current++; };
  }, [input.conversationId, input.productId, revision]);

  useEffect(() => {
    if (!focused || !openRetryable) return;
    const reconnect = () => { if (AppState.currentState === 'active') setRevision(value => value + 1); };
    const interval = setInterval(reconnect, 8000);
    const appState = AppState.addEventListener('change', state => { if (state === 'active') reconnect(); });
    if (typeof window !== 'undefined' && window.addEventListener) window.addEventListener('online', reconnect);
    return () => { clearInterval(interval); appState.remove(); if (typeof window !== 'undefined' && window.removeEventListener) window.removeEventListener('online', reconnect); };
  }, [focused, openRetryable]);

  const conversationId = context?.conversation?.id;
  const userId = context?.userId;
  useEffect(() => {
    if (!conversationId || !userId || !focused) return;
    let active = true;
    const scope = generation.current;
    let busy = false;
    let replay = false;
    const state = messageSync.current;
    let liveConnected = false;
    let lastRead = 0;
    const sync = async (afterSubscribe = false) => {
      if (!active || scope !== generation.current) return;
      if (busy) { if (afterSubscribe) replay = true; return; }
      busy = true;
      try {
        if (state.initial) {
          const page = await chatService.getMessages(conversationId);
          if (!active || scope !== generation.current) return;
          setMessages(current => mergeChatMessages(current, page.messages));
          setHasOlder(page.hasMore);
          const oldest = page.messages[0];
          cursor.current = oldest ? { created_at: oldest.created_at, id: oldest.id } : undefined;
          const latest = page.messages[page.messages.length - 1];
          state.after = latest ? { created_at: latest.created_at, id: latest.id } : undefined;
          state.initial = false;
        } else {
          // Recuperar todas las páginas nuevas tras un corte, incluso si llegaron >50 filas.
          // Realtime no mueve este cursor: así un evento nuevo no oculta una fila perdida anterior.
          for (let batch = 0; batch < 10; batch++) {
            const page = await chatService.getNewMessages(conversationId, state.after);
            if (!active || scope !== generation.current) return;
            setMessages(current => mergeChatMessages(current, page.messages));
            const latest = page.messages[page.messages.length - 1];
            if (latest) state.after = { created_at: latest.created_at, id: latest.id };
            if (!page.hasMore || !latest) break;
          }
        }
        setSyncError(null);
        setOffline(false); setNeedsLogin(false); lastRead = Date.now();
      } catch (reason) {
        if (active && scope === generation.current) { setSyncError(reason instanceof Error ? reason.message : 'No se pudo actualizar el historial.'); setOffline(isChatConnectionError(reason)); setNeedsLogin(isChatAuthError(reason)); }
      } finally {
        busy = false;
        if (active && scope === generation.current) setLoading(false);
        if (replay && active) { replay = false; void sync(); }
      }
    };
    // Suscribir antes de leer y volver a leer al conectar evita perder filas entre ambos pasos.
    const unsubscribe = chatService.subscribeMessages(conversationId, message => {
      if (active && scope === generation.current) setMessages(current => mergeChatMessages(current, [message]));
    }, status => {
      if (!active || scope !== generation.current) return;
      setLive(status === 'SUBSCRIBED');
      liveConnected = status === 'SUBSCRIBED';
      if (status === 'SUBSCRIBED') void sync(true);
    });
    void sync();
    refreshRef.current = () => { void sync(); };
    // Respaldo para reconexión/publicación Realtime aún no habilitada; no genera mensajes.
    const interval = setInterval(() => { if (AppState.currentState === 'active' && (!liveConnected || Date.now() - lastRead >= 30000)) void sync(); }, 8000);
    const appState = AppState.addEventListener('change', state => { if (state === 'active') void sync(); });
    const reconnect = () => { void sync(); };
    if (typeof window !== 'undefined' && window.addEventListener) window.addEventListener('online', reconnect);
    return () => { active = false; setLive(false); refreshRef.current = null; clearInterval(interval); appState.remove(); unsubscribe(); if (typeof window !== 'undefined' && window.removeEventListener) window.removeEventListener('online', reconnect); };
  }, [conversationId, userId, focused]);

  const send = async (text: string): Promise<boolean> => {
    if (!context || sendLock.current) return false;
    const body = text.trim();
    if (!body || body.length > 4000) { setError('Escribí un mensaje de hasta 4000 caracteres.'); return false; }
    if (!attempt.current || attempt.current.body !== body) attempt.current = { body, clientId: createChatClientId() };
    const request = attempt.current;
    const owner = generation.current;
    const lock = Symbol();
    sendLock.current = lock;
    setSending(true);
    setError(null);
    try {
      const result = await chatService.sendMessage({ productId: context.productId, conversationId: context.conversation?.id, body, clientId: request.clientId });
      if (owner !== generation.current) return false;
      setContext(current => current ? { ...current, conversation: result.conversation } : null);
      setMessages(current => mergeChatMessages(current, [result.message]));
      setOffline(false); setNeedsLogin(false);
      attempt.current = null;
      return true;
    } catch (reason) {
      if (owner === generation.current) { setError((reason instanceof Error ? reason.message : 'No se pudo confirmar el envío.') + ' Podés reintentar; se conserva el identificador del mensaje.'); setOffline(isChatConnectionError(reason)); setNeedsLogin(isChatAuthError(reason)); }
      return false;
    } finally {
      if (sendLock.current === lock) { sendLock.current = null; setSending(false); }
    }
  };

  const loadOlder = async () => {
    if (!conversationId || !cursor.current || loadingOlder || !hasOlder) return;
    const owner = generation.current;
    setLoadingOlder(true);
    try {
      const page = await chatService.getMessages(conversationId, cursor.current);
      if (owner !== generation.current) return;
      setMessages(current => mergeChatMessages(current, page.messages));
      setHasOlder(page.hasMore);
      const oldest = page.messages[0];
      if (oldest) cursor.current = { created_at: oldest.created_at, id: oldest.id };
      setSyncError(null);
    } catch (reason) {
      if (owner === generation.current) setSyncError(reason instanceof Error ? reason.message : 'No se pudo cargar el historial anterior.');
    } finally { if (owner === generation.current) setLoadingOlder(false); }
  };

  return { context, messages, loading, sending, loadingOlder, hasOlder, error, syncError, live, offline, needsLogin, send, loadOlder, refresh: () => refreshRef.current?.(), reload: () => setRevision(value => value + 1) };
}
