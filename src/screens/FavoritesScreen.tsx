import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useFavorites } from '../contexts/FavoritesProvider';
import type { FavoriteEntry } from '../state/favoritesStore';

function FavoriteCard({ entry, pending, onRemove, onOpen }: {
  entry: FavoriteEntry; pending: boolean; onRemove: () => void; onOpen: () => void;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const product = entry.product;
  const unavailable = !product || product.status !== 'activo';
  const cover = product?.cover_image || product?.images?.find((image) => image.is_cover)?.image_url || product?.images?.[0]?.image_url;
  return (
    <View style={styles.card}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Ver ${product?.title ?? 'producto'}`} disabled={unavailable} onPress={onOpen} style={styles.productLink}>
        {cover && !imageFailed ? (
          <Image source={{ uri: cover }} style={styles.image} onError={() => setImageFailed(true)} />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}><Ionicons name="image-outline" size={30} color="#9098B1" /></View>
        )}
        <View style={styles.info}>
          <Text style={styles.productTitle} numberOfLines={2}>{product?.title ?? 'Producto no disponible'}</Text>
          {product && <Text style={styles.price}>{product.currency === 'USD' ? 'USD' : '$'} {Number(product.price).toLocaleString('es-AR')}</Text>}
          {product?.location && <Text style={styles.location} numberOfLines={1}>{product.location}</Text>}
          {unavailable && <Text style={styles.unavailable}>Ya no está disponible</Text>}
        </View>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={`Quitar ${product?.title ?? 'producto'} de favoritos`} accessibilityState={{ disabled: pending }} disabled={pending} onPress={onRemove} style={styles.heart}>
        {pending ? <ActivityIndicator color="#0D9488" /> : <Ionicons name="heart" size={24} color="#EF4444" />}
      </Pressable>
    </View>
  );
}

// Embedded in Home so the existing shared top and bottom navigation remain visible.
export default function FavoritesScreen({ searchQuery = '' }: { searchQuery?: string }) {
  const router = useRouter();
  const { ready, userId, entries, pending, loading, loaded, error, refresh, toggle } = useFavorites();
  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));
  const query = searchQuery.trim().toLocaleLowerCase();
  const filtered = entries.filter(({ product }) => !query ||
    [product?.title, product?.location].some((value) => value?.toLocaleLowerCase().includes(query)));

  if (!ready) return <View style={styles.center}><ActivityIndicator color="#0D9488" /><Text>Cargando favoritos…</Text></View>;
  if (!userId) return (
    <View style={styles.center}>
      <Ionicons name="heart-outline" size={56} color="#0D9488" />
      <Text style={styles.title}>Tus favoritos, siempre con vos</Text>
      <Text style={styles.emptyText}>Iniciá sesión para guardar los productos que te gustan.</Text>
      <Pressable accessibilityRole="button" style={styles.button} onPress={() => router.push('/login')}><Text style={styles.buttonText}>Iniciar sesión</Text></Pressable>
    </View>
  );
  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.listContent}
      data={filtered}
      keyExtractor={(entry) => entry.productId}
      refreshing={loading}
      onRefresh={() => { void refresh(); }}
      ListHeaderComponent={<View style={styles.heading}>
        <Text accessibilityRole="header" style={styles.title}>Favoritos</Text>
        {loaded && <Text style={styles.emptyText}>{entries.length} {entries.length === 1 ? 'producto guardado' : 'productos guardados'}</Text>}
        {error && <View accessibilityLiveRegion="polite" style={styles.error}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable accessibilityRole="button" onPress={() => { void refresh(); }} style={styles.button}><Text style={styles.buttonText}>Reintentar</Text></Pressable>
        </View>}
      </View>}
      ListEmptyComponent={loading ? <ActivityIndicator color="#0D9488" /> : error ? undefined : <View style={styles.empty}>
        <Ionicons name="heart-outline" size={64} color="#0D9488" />
        <Text style={styles.title}>{query ? 'Sin coincidencias' : 'Todavía no guardaste favoritos'}</Text>
        <Text style={styles.emptyText}>{query ? 'Probá con otra búsqueda.' : 'Tocá el corazón de un producto para encontrarlo acá.'}</Text>
      </View>}
      renderItem={({ item }) => <FavoriteCard
        key={`${item.productId}-${item.product?.cover_image ?? ''}`}
        entry={item}
        pending={pending.includes(item.productId)}
        onRemove={() => { void toggle(item.productId); }}
        onOpen={() => router.push({ pathname: '/modal', params: { productId: item.productId } })}
      />}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: '#FFFFFF' },
  listContent: { padding: 20, paddingBottom: 95, gap: 12 },
  heading: { gap: 8, marginBottom: 8 },
  title: { fontSize: 22, fontWeight: '700', color: '#1F232E' },
  card: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 16, padding: 10, gap: 8 },
  productLink: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  image: { width: 88, height: 88, borderRadius: 10 },
  imagePlaceholder: { backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, gap: 6 },
  productTitle: { fontSize: 15, fontWeight: '600', color: '#1F232E' },
  price: { fontSize: 18, fontWeight: '700', color: '#1F232E' },
  location: { fontSize: 13, color: '#687182' },
  unavailable: { fontSize: 12, color: '#9F1239' },
  heart: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, padding: 24, paddingBottom: 95, alignItems: 'center', justifyContent: 'center', gap: 16 },
  empty: { alignItems: 'center', paddingVertical: 40, gap: 16 },
  emptyText: { fontSize: 15, color: '#687182' },
  button: { backgroundColor: '#0D9488', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24, alignSelf: 'center' },
  buttonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 15 },
  error: { gap: 12, padding: 12, backgroundColor: '#FFF1F2', borderRadius: 12 },
  errorText: { color: '#9F1239', fontSize: 14 },
});
