import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { productService } from '../services/productService';
import type { ProductCondition, ProductDetail, ProductStatus } from '../types/database.types';
import { supabase } from '../supabase';
import { CONDITION_LABELS, parseProductPrice, STATUS_LABELS } from '../utils/productPresentation';
import { createProductUserChangeListener } from '../utils/productAuthEvents';

export default function EditProductScreen() {
  const router = useRouter();
  const { productId } = useLocalSearchParams<{ productId?: string }>();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [condition, setCondition] = useState<ProductCondition>('bueno');
  const [status, setStatus] = useState<ProductStatus>('activo');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const submitting = useRef(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(createProductUserChangeListener(() => {
      setProduct(null);
      setRevision(value => value + 1);
    }));
    return () => subscription.unsubscribe();
  }, []);

  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setProduct(null);
    (async () => {
      if (!productId) throw new Error('Falta el ID de la publicación.');
      const [{ data: { user }, error: authError }, data] = await Promise.all([
        supabase.auth.getUser(),
        productService.getProductById(productId),
      ]);
      if (authError || !user) throw new Error('Iniciá sesión para editar tu producto.');
      if (!data || data.status === 'eliminado') throw new Error('La publicación ya no está disponible.');
      if (data.seller_id !== user.id) throw new Error('Solo el propietario puede editar esta publicación.');
      if (!active) return;
      setProduct(data);
      setTitle(data.title);
      setDescription(data.description || '');
      setPrice(Number(data.price).toLocaleString('es-AR', { maximumFractionDigits: 2, useGrouping: false }));
      setLocation(data.location || '');
      setCondition(data.condition);
      setStatus(data.status);
    })().catch(err => { if (active) setError(err.message || 'No se pudo cargar la publicación.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [productId, revision]));

  const back = () => router.canGoBack() ? router.back() : router.replace({ pathname: '/modal', params: { productId: productId || '' } });
  const save = async () => {
    if (!product || submitting.current) return;
    const amount = parseProductPrice(price);
    if (!title.trim()) { setError('Ingresá un título.'); return; }
    if (!Number.isFinite(amount) || amount <= 0) { setError('Ingresá un precio mayor a cero, por ejemplo 12500,50.'); return; }
    submitting.current = true;
    setSaving(true);
    setError(null);
    try {
      await productService.updateProduct(product.id, { title, description, price: amount, location, condition, status });
      back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron guardar los cambios.');
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Atrás" disabled={saving} onPress={back} style={styles.back}>
          <Ionicons name="chevron-back" size={26} color="#1F232E" />
        </TouchableOpacity>
        <Text accessibilityRole="header" style={styles.heading}>Editar producto</Text>
      </View>
      {loading ? <View style={styles.loading} role="status" accessibilityLiveRegion="polite"><ActivityIndicator color="#0D9488" /><Text>Cargando producto para editar...</Text></View> : (
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
            {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
            {product ? <>
              <Text style={styles.label}>Título</Text>
              <TextInput accessibilityLabel="Título" style={styles.input} value={title} onChangeText={setTitle} editable={!saving} maxLength={150} />
              <Text style={styles.label}>Descripción</Text>
              <TextInput accessibilityLabel="Descripción" style={[styles.input, styles.multiline]} multiline textAlignVertical="top" value={description} onChangeText={setDescription} editable={!saving} />
              <Text style={styles.label}>Precio ({product.currency})</Text>
              <TextInput accessibilityLabel="Precio" style={styles.input} value={price} onChangeText={setPrice} keyboardType="decimal-pad" editable={!saving} />
              <Text style={styles.hint}>Usá coma para los centavos. Ejemplo: 12.500,50.</Text>
              <Text style={styles.label}>Estado del artículo</Text>
              <View style={styles.options}>
                {(Object.keys(CONDITION_LABELS) as ProductCondition[]).map(value => (
                  <TouchableOpacity accessibilityRole="button" accessibilityState={{ selected: condition === value }} disabled={saving} key={value} onPress={() => setCondition(value)} style={[styles.option, condition === value && styles.selected]}><Text>{CONDITION_LABELS[value]}</Text></TouchableOpacity>
                ))}
              </View>
              <Text style={styles.label}>Estado de la publicación</Text>
              <View style={styles.options}>
                {(['activo', 'pausado', 'vendido'] as ProductStatus[]).map(value => (
                  <TouchableOpacity accessibilityRole="button" accessibilityState={{ selected: status === value }} disabled={saving} key={value} onPress={() => setStatus(value)} style={[styles.option, status === value && styles.selected]}><Text>{STATUS_LABELS[value]}</Text></TouchableOpacity>
                ))}
              </View>
              <Text style={styles.label}>Ubicación</Text>
              <TextInput accessibilityLabel="Ubicación" style={styles.input} value={location} onChangeText={setLocation} editable={!saving} />
              <Text style={styles.hint}>Categoría: {product.category?.name || 'Sin categoría'}</Text>
              <TouchableOpacity accessibilityRole="button" disabled={saving} onPress={save} style={[styles.save, saving && styles.disabled]}>
                {saving ? <ActivityIndicator color="#1F232E" /> : <Text style={styles.saveText}>Guardar cambios</Text>}
              </TouchableOpacity>
            </> : <TouchableOpacity onPress={() => setRevision(value => value + 1)}><Text style={styles.link}>Reintentar</Text></TouchableOpacity>}
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFF' }, flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  back: { padding: 6 }, heading: { fontSize: 22, fontWeight: '700', color: '#1F232E' }, loading: { marginTop: 40, alignItems: 'center', gap: 12 },
  form: { padding: 20, gap: 12, width: '100%', maxWidth: 640, alignSelf: 'center', paddingBottom: 40 },
  label: { fontWeight: '700', color: '#1F232E', marginTop: 8, fontSize: 15 },
  input: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 12, padding: 14, fontSize: 16, color: '#1F232E' },
  multiline: { minHeight: 120 }, hint: { color: '#64748B', fontSize: 13, lineHeight: 20 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, option: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 20, padding: 12 },
  selected: { backgroundColor: '#B4F4EB', borderColor: '#0D9488' },
  save: { padding: 16, borderRadius: 28, backgroundColor: '#3BD7C2', alignItems: 'center', marginTop: 16 },
  saveText: { color: '#1F232E', fontWeight: '700', fontSize: 16 }, disabled: { opacity: 0.6 },
  error: { color: '#B91C1C', lineHeight: 22 }, link: { color: '#0D9488', fontWeight: '700', padding: 12 },
});
