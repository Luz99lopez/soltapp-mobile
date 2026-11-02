import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { productService } from '../services/productService';
import type { ProductListItem } from '../types/database.types';
import { supabase } from '../supabase';
import { formatProductPrice, STATUS_LABELS } from '../utils/productPresentation';
import { createProductUserChangeListener } from '../utils/productAuthEvents';

export default function MyProductsScreen() {
  const router = useRouter();
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(createProductUserChangeListener(() => {
      setProducts([]);
      setRevision(value => value + 1);
    }));
    return () => subscription.unsubscribe();
  }, []);

  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true);
    setError(null);
    productService.getMyProducts().then(data => {
      if (active) setProducts(data);
    }).catch(err => {
      if (active) { setProducts([]); setError(err.message || 'No se pudieron cargar tus publicaciones.'); }
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [revision]));

  const back = () => router.canGoBack() ? router.back() : router.replace('/home?tab=profile');

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Atrás" onPress={back} style={styles.back}>
          <Ionicons name="chevron-back" size={26} color="#1F232E" />
        </TouchableOpacity>
        <Text accessibilityRole="header" style={styles.title}>Mis productos</Text>
        <TouchableOpacity accessibilityRole="button" onPress={() => router.push('/upload')} style={styles.newButton}>
          <Text style={styles.link}>Publicar</Text>
        </TouchableOpacity>
      </View>
      {!!error && (
        <View style={styles.message}>
          <Text accessibilityRole="alert" style={styles.error}>{error}</Text>
          <TouchableOpacity onPress={() => setRevision(value => value + 1)}><Text style={styles.link}>Reintentar</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/login')}><Text style={styles.link}>Iniciar sesión</Text></TouchableOpacity>
        </View>
      )}
      <FlatList
        data={products}
        keyExtractor={item => item.id}
        refreshing={loading}
        onRefresh={() => setRevision(value => value + 1)}
        contentContainerStyle={styles.list}
        ListHeaderComponent={loading && products.length > 0 ? <View style={styles.message} role="status" accessibilityLiveRegion="polite"><ActivityIndicator color="#0D9488" /><Text>Actualizando tus publicaciones...</Text></View> : undefined}
        ListEmptyComponent={loading ? <View style={styles.message} role="status" accessibilityLiveRegion="polite"><ActivityIndicator color="#0D9488" /><Text>Cargando tus publicaciones...</Text></View> : !error ? (
          <View style={styles.message}>
            <Ionicons name="bag-handle-outline" size={48} color="#9098B1" />
            <Text style={styles.emptyTitle}>Todavía no tenés publicaciones</Text>
            <Text style={styles.secondary}>Tus productos activos, pausados y vendidos aparecerán acá.</Text>
          </View>
        ) : undefined}
        renderItem={({ item }) => (
          <TouchableOpacity accessibilityRole="button" style={styles.card} onPress={() => router.push({ pathname: '/modal', params: { productId: item.id } })}>
            <ProductThumbnail uri={item.cover_image} />
            <View style={styles.info}>
              <Text style={styles.productTitle} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.price}>{formatProductPrice(item.price, item.currency)}</Text>
              <Text style={styles.status}>{STATUS_LABELS[item.status] || item.status}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9098B1" />
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

function ProductThumbnail({ uri }: { uri?: string | null }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [uri]);
  return uri && !failed ? <Image source={{ uri }} style={styles.image} onError={() => setFailed(true)} /> : (
    <View style={[styles.image, styles.placeholder]}><Ionicons name="image-outline" size={30} color="#9098B1" /></View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#FFF', gap: 8 },
  back: { padding: 6 }, title: { flex: 1, fontSize: 22, fontWeight: '700', color: '#1F232E' },
  newButton: { padding: 8 }, link: { color: '#0D9488', fontWeight: '700', paddingVertical: 8 },
  list: { width: '100%', maxWidth: 720, alignSelf: 'center', padding: 16, gap: 12, flexGrow: 1 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', gap: 12 },
  image: { width: 88, height: 96, borderRadius: 12, backgroundColor: '#E2E8F0' },
  placeholder: { alignItems: 'center', justifyContent: 'center' }, info: { flex: 1, gap: 6 },
  productTitle: { fontSize: 16, fontWeight: '600', color: '#1F232E' },
  price: { fontSize: 18, fontWeight: '700', color: '#0D9488' },
  status: { color: '#475569', fontSize: 13 }, secondary: { color: '#64748B', textAlign: 'center', lineHeight: 22 },
  message: { padding: 24, alignItems: 'center', gap: 12 }, emptyTitle: { fontSize: 18, fontWeight: '600', textAlign: 'center' },
  error: { color: '#B91C1C', textAlign: 'center' },
});
