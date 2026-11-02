import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../supabase';
import { chatService } from '../services/chatService';
import type { ChatInboxItem } from '../types/chat.types';
import type { ConversationItem } from './InboxView';
import { createProductUserChangeListener } from '../utils/productAuthEvents';
import { formatProductPrice } from '../utils/productPresentation';
import { isChatAuthError, isChatConnectionError, isRetryableChatError } from '../utils/chatRequest';

export default function ChatInboxList({ onOpen, onCountChange }: { onOpen: (item: ConversationItem) => void; onCountChange: (count: number) => void }) {
  const router = useRouter();
  const [items, setItems] = useState<ChatInboxItem[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [offline, setOffline] = useState(false);
  const [revision, setRevision] = useState(0);
  const generation = useRef(0);
  const olderPageLoaded = useRef(false);
  useEffect(() => { onCountChange(items.length); }, [items.length, onCountChange]);
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(createProductUserChangeListener(() => {
      generation.current++;
      olderPageLoaded.current = false;
      setItems([]); setUserId(null); setLoadingMore(false); setHasMore(false); setRevision(value => value + 1);
    }));
    return () => subscription.unsubscribe();
  }, []);

  useFocusEffect(useCallback(() => {
    let active = true;
    const scope = ++generation.current;
    let busy = false;
    let replay = false;
    let available = false;
    let retryable = true;
    let liveConnected = false;
    let lastRead = 0;
    let unsubscribe: (() => void) | undefined;
    setLoading(true);
    setError(null);
    setNeedsLogin(false);
    const refresh = async () => {
      if (!active || scope !== generation.current) return;
      if (busy) { replay = true; return; }
      busy = true;
      try {
        const page = await chatService.getInbox();
        if (!active || scope !== generation.current) return;
        setItems(current => {
          const merged = new Map(current.map(item => [item.id, item]));
          page.items.forEach(item => merged.set(item.id, item));
          return [...merged.values()].sort((a, b) => b.updated_at.localeCompare(a.updated_at) || b.id.localeCompare(a.id));
        });
        setUserId(page.userId);
        if (!olderPageLoaded.current) setHasMore(page.hasMore);
        setError(null);
        setNeedsLogin(false); setOffline(false); lastRead = Date.now();
        retryable = true;
        if (!available) { available = true; unsubscribe = chatService.subscribeInbox(page.userId, refresh, status => { liveConnected = status === 'SUBSCRIBED'; if (liveConnected) void refresh(); }); }
      } catch (reason) {
        retryable = isRetryableChatError(reason);
        if (active && scope === generation.current) { setError(reason instanceof Error ? reason.message : 'No se pudo cargar el Buzón.'); setNeedsLogin(isChatAuthError(reason)); setOffline(isChatConnectionError(reason)); }
      } finally { busy = false; if (active && scope === generation.current) { setLoading(false); if (replay) { replay = false; void refresh(); } } }
    };
    void refresh();
    const reconnect = () => { if (retryable && AppState.currentState === 'active') void refresh(); };
    const interval = setInterval(() => { if (!liveConnected || Date.now() - lastRead >= 30000) reconnect(); }, 8000);
    const appState = AppState.addEventListener('change', state => { if (retryable && state === 'active') void refresh(); });
    if (typeof window !== 'undefined' && window.addEventListener) window.addEventListener('online', reconnect);
    return () => { active = false; generation.current++; clearInterval(interval); appState.remove(); unsubscribe?.(); if (typeof window !== 'undefined' && window.removeEventListener) window.removeEventListener('online', reconnect); };
  }, [revision]));

  const loadMore = async () => {
    if (!userId || loadingMore) return;
    const scope = generation.current;
    setLoadingMore(true);
    try {
      const page = await chatService.getInbox(items.length);
      if (page.userId !== userId || scope !== generation.current) return;
      olderPageLoaded.current = true;
      setItems(current => [...new Map([...current, ...page.items].map(item => [item.id, item])).values()]);
      setHasMore(page.hasMore);
    } catch (reason) { if (scope === generation.current) setError(reason instanceof Error ? reason.message : 'No se pudieron cargar más conversaciones.'); }
    finally { if (scope === generation.current) setLoadingMore(false); }
  };

  return <View style={styles.section}>
    <Text style={styles.title}>Conversaciones</Text>
    {offline && <Text style={styles.secondary} role="status" accessibilityLiveRegion="polite">Sin conexión con el chat. Las conversaciones cargadas se conservan.</Text>}
    {loading && <View style={styles.status} role="status" accessibilityLiveRegion="polite"><ActivityIndicator color="#0D9488" /><Text>Cargando conversaciones...</Text></View>}
    {!!error && <View style={styles.status}>
      <Text accessibilityRole="alert">{error}</Text>
      <TouchableOpacity accessibilityRole="button" onPress={() => setRevision(value => value + 1)}><Text style={styles.link}>Reintentar</Text></TouchableOpacity>
      {needsLogin && <TouchableOpacity accessibilityRole="button" onPress={() => router.push('/login')}><Text style={styles.link}>Iniciar sesión</Text></TouchableOpacity>}
    </View>}
    {!loading && !error && !items.length && <Text style={styles.secondary}>Todavía no tenés conversaciones. Abrí un producto y elegí Hacer oferta.</Text>}
    {items.map(item => {
      const cover = (item.product?.images?.find(image => image.is_cover) || item.product?.images?.[0])?.image_url;
      const title = item.product?.title || 'Publicación no disponible';
      const price = item.product ? formatProductPrice(item.product.price, item.product.currency) : '';
      return <TouchableOpacity accessibilityRole="button" key={item.id} style={styles.row} onPress={() => onOpen({ id: item.id, conversationId: item.id, productId: item.product_id, buyerId: item.buyer_id, sellerId: item.seller_id, imageUri: cover, senderName: item.counterpartName, sellerName: item.buyer_id === userId ? item.counterpartName : 'Tú', productTitle: title, productPrice: price, date: item.updated_at })}>
        {cover ? <Image source={{ uri: cover }} style={styles.image} /> : <View style={[styles.image, styles.status]}><Ionicons name="chatbubble-outline" size={22} color="#64748B" /></View>}
        <View style={styles.info}>
          <Text style={styles.name}>{item.counterpartName}</Text>
          <Text numberOfLines={1}>{title}{price ? ` · ${price}` : ''}</Text>
          <Text style={styles.secondary} numberOfLines={1}>{item.lastMessage?.body || 'Sin mensajes todavía'}</Text>
        </View>
        <Text style={styles.date}>{new Date(item.updated_at).toLocaleDateString('es-AR')}</Text>
      </TouchableOpacity>;
    })}
    {hasMore && <TouchableOpacity accessibilityRole="button" disabled={loadingMore} onPress={loadMore} style={styles.status}><Text style={styles.link}>{loadingMore ? 'Cargando...' : 'Cargar más conversaciones'}</Text></TouchableOpacity>}
  </View>;
}

const styles = StyleSheet.create({
  section: { paddingVertical: 16 }, title: { fontSize: 18, fontWeight: '700', color: '#1F232E', marginBottom: 12 },
  row: { flexDirection: 'row', gap: 12, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', alignItems: 'center' },
  image: { width: 48, height: 52, borderRadius: 8, backgroundColor: '#F1F5F9' }, info: { flex: 1, gap: 5 }, name: { fontWeight: '700' },
  secondary: { color: '#64748B', fontSize: 13, lineHeight: 20 }, date: { fontSize: 11, color: '#64748B' },
  status: { paddingVertical: 12, gap: 8, alignItems: 'center', justifyContent: 'center' }, link: { color: '#0D9488', padding: 8, fontWeight: '600' },
});
