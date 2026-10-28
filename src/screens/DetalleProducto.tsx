import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { PRODUCTS, type Product } from '../data/products';

function ProductGallery({ product }: { product: Product }) {
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState(false);
  const count = product.images.length;
  const canSlide = count > 1;

  const changePhoto = (direction: number) => {
    if (!canSlide) return;
    setFailed(false);
    setIndex((current) => (current + direction + count) % count);
  };

  return (
    <View style={styles.gallery}>
      {count > 0 && !failed ? (
        <Image
          key={index}
          source={{ uri: product.images[index] }}
          style={styles.photo}
          resizeMode="cover"
          accessibilityLabel={`${product.title}, foto ${index + 1} de ${count}`}
          onError={() => setFailed(true)}
        />
      ) : (
        <View style={styles.placeholder}>
          <Ionicons name="image-outline" size={40} color="#9098B1" />
          <Text style={styles.placeholderText}>Foto no disponible</Text>
        </View>
      )}
      {([-1, 1] as const).map((direction) => (
        <Pressable
          key={direction}
          accessibilityRole="button"
          accessibilityLabel={direction === -1 ? 'Foto anterior' : 'Foto siguiente'}
          accessibilityState={{ disabled: !canSlide }}
          disabled={!canSlide}
          onPress={() => changePhoto(direction)}
          style={({ pressed }) => [
            styles.arrow,
            direction === -1 ? styles.leftArrow : styles.rightArrow,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons
            name={direction === -1 ? 'chevron-back' : 'chevron-forward'}
            size={24}
            color={canSlide ? '#1F232E' : '#B5BBC5'}
          />
        </Pressable>
      ))}
    </View>
  );
}

export default function DetalleProducto() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const router = useRouter();
  const productId = Array.isArray(id) ? id[0] : id;
  const product = PRODUCTS.find((item) => item.id === productId);
  const characteristics = product
    ? [product.condition, product.brand, product.color, ...(product.details ?? [])]
        .filter((value) => value?.trim())
        .join(' · ')
    : '';

  return (
    <SafeAreaView style={styles.screen}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Volver a los productos"
        onPress={() => router.canGoBack() ? router.back() : router.replace('/home')}
        style={styles.back}
      >
        <Ionicons name="arrow-back" size={24} color="#1F232E" />
      </Pressable>
      {product ? (
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <View style={styles.galleryContainer}>
            <ProductGallery key={product.id} product={product} />
          </View>
          <View style={styles.productInfo}>
            <Text accessibilityRole="header" style={styles.heading}>{product.title}</Text>
            <Text style={styles.characteristics}>
              {characteristics || 'Sin características especificadas'}
            </Text>
            <Text style={styles.heading}>{product.price}</Text>
          </View>
        </ScrollView>
      ) : (
        <Text style={styles.notFound}>Producto no encontrado</Text>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { flex: 1 },
  contentContainer: { paddingBottom: 24 },
  productInfo: { paddingHorizontal: 20, gap: 12 },
  heading: { fontSize: 24, lineHeight: 32, fontWeight: '700', color: '#1F232E', textAlign: 'left' },
  characteristics: { fontSize: 15, lineHeight: 22, color: '#687182', textAlign: 'left' },
  back: { marginLeft: 20, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  galleryContainer: {
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: 'center',
  },
  gallery: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: '#F2F4F7',
  },
  photo: { width: '100%', height: '100%' },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  placeholderText: { color: '#687182', fontSize: 14 },
  arrow: {
    position: 'absolute',
    top: '50%',
    marginTop: -22,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  leftArrow: { left: 12 },
  rightArrow: { right: 12 },
  pressed: { opacity: 0.7 },
  notFound: { margin: 20, color: '#687182', fontSize: 16 },
});
