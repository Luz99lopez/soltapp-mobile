import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { DEMO_SELLER, PRODUCTS, type Product, type Seller } from '../data/products';
import { DetailHeader, DetailBottomNav } from '../components/DetailNavigation';

function SellerCard({ seller, onChat }: { seller: Seller; onChat: () => void }) {
  const [avatarFailed, setAvatarFailed] = useState(false);
  const rating = Math.min(5, Math.max(0, seller.rating));

  return (
    <View style={styles.sellerCard}>
      <View style={styles.sellerAvatar}>
        {seller.avatarUrl && !avatarFailed ? (
          <Image
            source={{ uri: seller.avatarUrl }}
            style={styles.photo}
            accessibilityLabel={`Foto de ${seller.name}`}
            onError={() => setAvatarFailed(true)}
          />
        ) : (
          <Ionicons name="person-outline" size={26} color="#687182" />
        )}
      </View>
      <View style={styles.sellerInfo}>
        <Text style={styles.sellerName} numberOfLines={2}>{seller.name}</Text>
        <View style={styles.stars} accessible accessibilityLabel={`${rating} de 5 estrellas`}>
          {Array.from({ length: 5 }, (_, index) => (
            <Ionicons
              key={index}
              name={rating >= index + 1 ? 'star' : rating >= index + 0.5 ? 'star-half' : 'star-outline'}
              size={16}
              color="#1F232E"
            />
          ))}
        </View>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Abrir chat con ${seller.name}`}
        onPress={onChat}
        style={({ pressed }) => [styles.chatButton, pressed && styles.pressed]}
      >
        <Text style={styles.chatLabel}>chat</Text>
      </Pressable>
    </View>
  );
}

function ProductDescriptions({ product }: { product: Product }) {
  const [descriptionOpen, setDescriptionOpen] = useState(true);
  const [detailsOpen, setDetailsOpen] = useState(true);

  return (
    <View style={styles.descriptionBox}>
      <View style={styles.sectionHeader}>
        <Text accessibilityRole="header" style={styles.sectionSubtitle}>Descripcion</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${descriptionOpen ? 'Ocultar' : 'Mostrar'} descripción del producto`}
          accessibilityState={{ expanded: descriptionOpen }}
          onPress={() => setDescriptionOpen((open) => !open)}
          style={styles.sectionToggle}
        >
          <Ionicons name={descriptionOpen ? 'chevron-up' : 'chevron-down'} size={24} color="#D9D9D9" />
        </Pressable>
      </View>
      {descriptionOpen && <Text style={styles.descriptionText}>{product.description}</Text>}
      <View style={styles.sectionDivider} />
      <View style={styles.sectionHeader}>
        <Text accessibilityRole="header" style={styles.sectionSubtitle}>Ficha del producto</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${detailsOpen ? 'Ocultar' : 'Mostrar'} color y estado`}
          accessibilityState={{ expanded: detailsOpen }}
          onPress={() => setDetailsOpen((open) => !open)}
          style={styles.sectionToggle}
        >
          <Ionicons name={detailsOpen ? 'chevron-up' : 'chevron-down'} size={24} color="#D9D9D9" />
        </Pressable>
      </View>
      {detailsOpen && (
        <View style={styles.detailRows}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Color</Text>
            <Text style={styles.detailValue}>{product.color?.trim() || 'No especificado'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Estado</Text>
            <Text style={styles.detailValue}>{product.condition?.trim() || 'No especificado'}</Text>
          </View>
        </View>
      )}
      <View style={styles.sectionDivider} />
      <View style={styles.detailRow}>
        <Text accessibilityRole="header" style={[styles.sectionSubtitle, styles.fixedDetailLabel]}>Marca</Text>
        <Text style={styles.detailValue}>{product.brand?.trim() || 'No especificada'}</Text>
      </View>
      <View style={styles.sectionDivider} />
      <View style={styles.detailRow}>
        <Text accessibilityRole="header" style={[styles.sectionSubtitle, styles.fixedDetailLabel]}>Estado</Text>
        <Text style={styles.detailValue}>{product.condition?.trim() || 'No especificado'}</Text>
      </View>
    </View>
  );
}

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
  const seller = product?.seller ?? DEMO_SELLER;
  const characteristics = product
    ? [product.condition, product.brand, product.color, ...(product.details ?? [])]
        .filter((value) => value?.trim())
        .join(' · ')
    : '';

  return (
    <SafeAreaView style={styles.screen}>
      <DetailHeader />
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
            <SellerCard
              key={`${product.id}-${seller.avatarUrl ?? ''}`}
              seller={seller}
              onChat={() => router.push({
                pathname: '/chat',
                params: {
                  productTitle: product.title,
                  productPrice: product.price,
                  sellerName: seller.name,
                },
              })}
            />
            <View style={styles.categoryTag}>
              <Text style={styles.categoryText}>{product.category}</Text>
            </View>
            <View style={styles.categoryTag}>
              <Text style={styles.categoryText}>{product.subcategory}</Text>
            </View>
            <ProductDescriptions key={product.id} product={product} />
          </View>
        </ScrollView>
      ) : (
        <View style={styles.content}><Text style={styles.notFound}>Producto no encontrado</Text></View>
      )}
      <DetailBottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { flex: 1 },
  contentContainer: { paddingBottom: 24 },
  productInfo: { paddingHorizontal: 20, gap: 12 },
  descriptionBox: {
    width: '100%',
    borderWidth: 2,
    borderColor: '#D9D9D9',
    borderRadius: 10,
    padding: 10,
    gap: 10,
  },
  sectionSubtitle: { fontSize: 16, lineHeight: 22, fontWeight: '700', color: '#1F232E', textAlign: 'left' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  sectionToggle: { minWidth: 44, minHeight: 44, alignItems: 'flex-end', justifyContent: 'center' },
  detailRows: { gap: 10 },
  fixedDetailLabel: { flex: 1 },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  detailLabel: { flex: 1, fontSize: 15, lineHeight: 23, color: '#1F232E' },
  detailValue: { flex: 1, fontSize: 15, lineHeight: 23, color: '#1F232E', textAlign: 'right' },
  descriptionText: { fontSize: 15, lineHeight: 23, color: '#1F232E', textAlign: 'left' },
  sectionDivider: { height: 2, backgroundColor: '#D9D9D9', alignSelf: 'stretch' },
  categoryTag: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
    borderRadius: 20,
    backgroundColor: '#D9D9D9',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  categoryText: { fontSize: 15, lineHeight: 22, color: '#1F232E', textAlign: 'left', flexShrink: 1 },
  sellerCard: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#1F232E',
    borderRadius: 10,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sellerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#D5D9E0',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sellerInfo: { flex: 1, minWidth: 0, gap: 5 },
  sellerName: { fontSize: 16, lineHeight: 21, fontWeight: '700', color: '#1F232E' },
  stars: { flexDirection: 'row', gap: 2 },
  chatButton: {
    borderWidth: 1,
    borderColor: '#1F232E',
    borderRadius: 999,
    backgroundColor: 'transparent',
    paddingHorizontal: 18,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatLabel: { fontSize: 15, color: '#1F232E' },
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
