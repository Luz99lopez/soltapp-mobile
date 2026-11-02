import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { productService } from '../services/productService';
import type { ProductDetail, ProductListItem, ProductReview } from '../types/database.types';
import { supabase } from '../supabase';
import ProductDialog from '../components/ProductDialog';
import { CONDITION_LABELS, STATUS_LABELS, formatProductPrice } from '../utils/productPresentation';

// SVGs oficiales
import BuscarIcon from '../../assets/svgs/Buscar.svg';
import VerTodoIcon from '../../assets/svgs/Ver todo.svg';
import EstrellaIcon from '../../assets/svgs/Estrella.svg';
import HomeIcon from '../../assets/svgs/Home.svg';
import CorazonIcon from '../../assets/svgs/Corazón.svg';
import MasIcon from '../../assets/svgs/Más.svg';
import MailIcon from '../../assets/svgs/mail.svg';
import AvatarIcon from '../../assets/svgs/Avatar.svg';

export default function ProductDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ productId?: string; id?: string }>();
  const productId = params?.productId || params?.id;

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Estados de UI
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [descExpanded, setDescExpanded] = useState<boolean>(true);
  const [detailsExpanded, setDetailsExpanded] = useState<boolean>(true);
  const [imageError, setImageError] = useState<boolean>(false);
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [reviewsError, setReviewsError] = useState<string | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<ProductListItem[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [relatedError, setRelatedError] = useState<string | null>(null);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const deletionPending = useRef(false);
  const loadedProductId = useRef<string | null>(null);
  const isOwner = !!viewerId && viewerId === product?.seller_id;

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setViewerId(session?.user.id || null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Recargar al volver de editar; descartar respuestas de una pantalla anterior.
  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true);
    setError(null);
    // Mantener el artículo al volver; validar datos nuevos sin vaciar toda la pantalla.
    if (loadedProductId.current !== productId) {
      setProduct(null);
      setCurrentImageIndex(0);
      setImageError(false);
      setReviews([]);
      setRelatedProducts([]);
    }
    setReviewsError(null);
    setRelatedError(null);
    (async () => {
      if (!productId || Array.isArray(productId)) throw new Error('No se especificó un ID de producto válido.');
      const [data, auth] = await Promise.all([
        productService.getProductById(productId), supabase.auth.getUser(),
      ]);
      if (!active) return;
      if (!data || data.status === 'eliminado') {
        setProduct(null);
        loadedProductId.current = null;
        throw new Error('El producto no fue encontrado o ya no está disponible.');
      }
      loadedProductId.current = data.id;
      setViewerId(auth.data.user?.id || null);
      setProduct(data);
      setLoading(false);
      setReviewsLoading(true);
      setRelatedLoading(true);
      const [opinions, related] = await Promise.allSettled([
        productService.getSellerReviews(data.seller_id),
        productService.getActiveProducts({ categoryId: data.category_id, limit: 7 }),
      ]);
      if (!active) return;
      if (opinions.status === 'fulfilled') setReviews(opinions.value);
      else setReviewsError('No se pudieron cargar las opiniones de compradores.');
      if (related.status === 'fulfilled') setRelatedProducts(related.value.products.filter(item => item.id !== data.id));
      else setRelatedError('No se pudieron cargar los productos relacionados.');
      setReviewsLoading(false);
      setRelatedLoading(false);
    })().catch(err => { if (active) setError(err.message || 'Error al cargar el producto.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [productId]));

  useEffect(() => { setImageError(false); }, [currentImageIndex]);
  useEffect(() => { setIsFavorite(false); }, [productId]);

  const back = () => router.canGoBack() ? router.back() : router.replace('/home');
  const removeProduct = async () => {
    if (!product || !isOwner || deletionPending.current) return;
    deletionPending.current = true;
    setDeleting(true);
    setDeleteError(null);
    try {
      await productService.deleteProduct(product.id);
      setShowDelete(false);
      setProduct(null);
      back();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'No se pudo eliminar la publicación.');
    } finally {
      deletionPending.current = false;
      setDeleting(false);
    }
  };

  // Formato de precio
  const formattedPrice = product ? formatProductPrice(product.price, product.currency) : '';

  // Lista de imágenes con validación de URL y descarte de blobs temporales rotos
  const imagesList = [...(product?.images || [])]
    .sort((a, b) => Number(b.is_cover) - Number(a.is_cover) || a.position - b.position)
    .map(img => img.image_url)
    .filter(url => !!url && !url.startsWith('blob:') && !(Platform.OS === 'web' && url.startsWith('file:')));

  const totalImages = imagesList.length;

  // Toggle de Favorito
  const toggleFavorite = () => {
    setIsFavorite(value => !value);
  };

  // Navegación siguiente / anterior de fotos
  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % totalImages);
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + totalImages) % totalImages);
  };

  // Navegar al chat con el vendedor
  const handleOpenChat = () => {
    if (!product || isOwner) return;
    const seller = product.seller?.full_name || product.seller?.username || 'Vendedor';
    router.push({
      pathname: '/chat',
      params: {
        productId: product.id,
        sellerId: product.seller_id,
        buyerId: viewerId || 'guest',
        imageUri: imagesList[0] || '',
        productTitle: product.title,
        productPrice: formattedPrice,
        sellerName: seller,
      },
    } as any);
  };

  const sellerName = product?.seller?.full_name || product?.seller?.username || 'Vendedor';
  const sellerInitial = sellerName.charAt(0).toUpperCase();
  const sellerAvatar = product?.seller?.avatar_url;

  const conditionLabel = product ? CONDITION_LABELS[product.condition] || product.condition : '';
  const reviewAverage = reviews.length ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toLocaleString('es-AR', { maximumFractionDigits: 1 }) : null;

  // Navegar al carrito / pantalla de compras
  const handleBuyProduct = () => {
    if (!product || isOwner || product.status !== 'activo') return;
    if (!viewerId) { router.push('/login'); return; }
    router.push({
      pathname: '/cart',
      params: {
        productId: product.id,
        sellerId: product.seller_id || '',
        title: product.title,
        price: formattedPrice,
        condition: conditionLabel,
        sellerName: sellerName,
        sellerAvatar: sellerAvatar || '',
        imageUri: imagesList[0] || '',
      },
    } as any);
  };

  return (
    <SafeAreaView testID="product-detail-screen" style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* 1. Header Navbar Superior Exacto a Soltapp */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={back}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color="#1F232E" />
        </TouchableOpacity>

        <View style={styles.logoWrapper}>
          <Image source={require('../../assets/images/product-detail-mark.png')} style={{ width: 36, height: 23.4 }} resizeMode="contain" accessibilityLabel="Soltapp" />
        </View>

        <View style={styles.searchBar}>
          <BuscarIcon width={16} height={16} />
          <Text style={styles.searchPlaceholder} numberOfLines={1}>
            Buscar en todas las categorías
          </Text>
        </View>

        <View style={styles.headerRightIcons}>
          <TouchableOpacity style={styles.headerIconButton} activeOpacity={0.7}>
            <VerTodoIcon width={22} height={22} />
          </TouchableOpacity>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitial}>U</Text>
          </View>
        </View>
      </View>

      {/* Contenido Principal */}
      {loading && !product ? (
        <View style={styles.centerWrapper}>
          <ActivityIndicator size="large" color="#1DE9B6" />
          <Text style={styles.loadingText}>Cargando publicación...</Text>
        </View>
      ) : !product ? (
        <View style={styles.centerWrapper}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error || 'Producto no encontrado'}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={back}>
            <Text style={styles.retryBtnText}>Volver</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {loading && <View style={styles.refreshStatus} role="status" accessibilityLiveRegion="polite"><ActivityIndicator size="small" color="#0D9488" /><Text>Actualizando publicación...</Text></View>}
          {!!error && <Text accessibilityRole="alert" style={styles.errorText}>{error}</Text>}
          {/* 2. Galería / Slider de Fotos Hero */}
          <View style={styles.heroGalleryContainer}>
            {!imageError && imagesList[currentImageIndex] ? <Image
              source={{
                uri: imagesList[currentImageIndex],
              }}
              style={styles.heroImage}
              resizeMode="cover"
              onError={() => setImageError(true)}
            /> : <View style={styles.centerWrapper}><Ionicons name="image-outline" size={56} color="#9098B1" /><Text>Imagen no disponible</Text></View>}

            {/* Flecha Siguiente (si hay más de 1 foto) */}
            {totalImages > 1 && (
              <TouchableOpacity style={styles.sliderNextBtn} onPress={handleNextImage} activeOpacity={0.8}>
                <Ionicons name="chevron-forward" size={18} color="#1F232E" />
              </TouchableOpacity>
            )}

            {/* Contador de fotos (ej: 1/4) */}
            <View style={styles.counterBadge}>
              <Text style={styles.counterBadgeText}>
                {totalImages ? `${currentImageIndex + 1}/${totalImages}` : 'Sin fotos'}
              </Text>
            </View>

            {/* Botón de Favorito */}
            <TouchableOpacity style={styles.favBadge} onPress={toggleFavorite} activeOpacity={0.85}>
              <Ionicons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={16}
                color={isFavorite ? '#EF4444' : '#1F232E'}
              />
              <Text style={styles.favBadgeText}>{isFavorite ? 'Guardado' : 'Guardar'}</Text>
            </TouchableOpacity>
          </View>

          {/* 3. Título y Subtítulo */}
          <Text style={styles.productTitle}>{product.title}</Text>
          <Text style={styles.productSpecs}>
            {conditionLabel} · {product.category?.name || 'Varios'} · {product.location || 'Ubicación no informada'}
          </Text>

          {/* 4. Precio Grande */}
          <Text style={styles.productPrice}>{formattedPrice}</Text>

          {/* 5. Tarjeta del Vendedor (¿Quién realizó la publicación?) */}
          <View style={styles.sellerCard}>
            <View style={styles.sellerAvatarWrapper}>
              {sellerAvatar ? (
                <Image source={{ uri: sellerAvatar }} style={styles.sellerAvatarImg} />
              ) : (
                <View style={styles.sellerAvatarPlaceholder}>
                  <Text style={styles.sellerAvatarInitial}>{sellerInitial}</Text>
                </View>
              )}
            </View>

            <View style={styles.sellerInfoCol}>
              <Text style={styles.sellerName}>{sellerName}</Text>
              <View style={styles.sellerRatingRow}>
                {reviewAverage && <EstrellaIcon width={13} height={13} />}
                <Text style={styles.sellerRatingNumber}>{reviewAverage ? `${reviewAverage} (${reviews.length} recientes)` : 'Sin valoraciones disponibles'}</Text>
              </View>
            </View>

            {!isOwner && <TouchableOpacity style={styles.chatBtnOutline} onPress={handleOpenChat} activeOpacity={0.75}>
              <Text style={styles.chatBtnOutlineText}>Chat</Text>
            </TouchableOpacity>}
          </View>

          {/* 6. Tags / Categorías en Pills */}
          <View style={styles.categoryPillsRow}>
            <View style={styles.categoryPill}>
              <Text style={styles.categoryPillText}>{product.category?.name || 'Sin categoría'}</Text>
            </View>
            <View style={styles.categoryPill}>
              <Text style={styles.categoryPillText}>{STATUS_LABELS[product.status] || product.status}</Text>
            </View>
          </View>

          {/* 7. Acordeón 1: Descripción */}
          <View style={styles.accordionBox}>
            <TouchableOpacity
              style={styles.accordionHeader}
              onPress={() => setDescExpanded(!descExpanded)}
              activeOpacity={0.7}
            >
              <Text style={styles.accordionTitle}>Descripción</Text>
              <Ionicons
                name={descExpanded ? 'chevron-up' : 'chevron-down'}
                size={18}
                color="#1F232E"
              />
            </TouchableOpacity>

            {descExpanded && (
              <Text style={styles.accordionBodyText}>
                {product.description || 'Sin descripción detallada por el vendedor.'}
              </Text>
            )}
          </View>

          {/* 8. Acordeón 2: Detalles / Especificaciones */}
          <View style={styles.accordionBox}>
            <TouchableOpacity
              style={styles.accordionHeader}
              onPress={() => setDetailsExpanded(!detailsExpanded)}
              activeOpacity={0.7}
            >
              <Text style={styles.accordionTitle}>Detalles</Text>
              <Ionicons
                name={detailsExpanded ? 'chevron-up' : 'chevron-down'}
                size={18}
                color="#1F232E"
              />
            </TouchableOpacity>

            {detailsExpanded && (
              <View style={styles.detailsGrid}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailKey}>Color</Text>
                  <Text style={styles.detailValue}>{product.color || 'No informado'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailKey}>Marca</Text>
                  <Text style={styles.detailValue}>{product.brand || 'No informada'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailKey}>Estado</Text>
                  <Text style={styles.detailValue}>{conditionLabel}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailKey}>Categoría</Text>
                  <Text style={styles.detailValue}>{product.category?.name || 'General'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailKey}>Moneda</Text>
                  <Text style={styles.detailValue}>{product.currency || 'ARS'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailKey}>Ubicación</Text>
                  <Text style={styles.detailValue}>{product.location || 'No informada'}</Text>
                </View>
              </View>
            )}
          </View>

          {/* 9. Caja de Envío y Seguridad */}
          <View style={styles.shippingBox}>
            <View style={styles.shippingBadgeRow}>
              <View style={styles.shippingTagBadge}>
                <Text style={styles.shippingTagText}>Solo venta en persona</Text>
              </View>
            </View>

            <View style={styles.shippingFeatureRow}>
              <Ionicons name="location-sharp" size={16} color="#1F232E" />
              <Text style={styles.shippingFeatureText}>{product.location || 'Ubicación no informada'}</Text>
            </View>

            <View style={styles.shippingFeatureRow}>
              <Ionicons name="shield-checkmark" size={16} color="#0D9488" />
              <Text style={styles.shippingFeatureText}>Coordiná el encuentro con el vendedor</Text>
            </View>
          </View>

          {/* 10. Metadata de la publicación (Visitas y fecha) */}
          <View style={styles.metadataRow}>
            <Text style={styles.metadataText}>Publicado el {new Date(product.created_at).toLocaleDateString('es-AR')}</Text>
          </View>

          {/* 11. Sección de Valoraciones del Vendedor */}
          <View style={styles.reviewsSection}>
            <View style={styles.reviewsHeaderRow}>
              <EstrellaIcon width={18} height={18} />
              {reviewAverage && <Text style={styles.reviewsAverage}>{reviewAverage}</Text>}
              <Text style={styles.reviewsSellerTitle}>Opiniones de compradores</Text>
            </View>
            <Text style={styles.reviewDate}>Sobre el vendedor · hasta 20 valoraciones recientes</Text>
            {reviewsLoading ? <View style={styles.refreshStatus} role="status" accessibilityLiveRegion="polite"><ActivityIndicator color="#0D9488" /><Text>Cargando opiniones...</Text></View> : reviewsError ? <Text accessibilityRole="alert">{reviewsError}</Text> : !reviews.length ? <Text style={styles.reviewDate}>Todavía no hay opiniones de compradores.</Text> : null}

            {/* Lista de valoraciones */}
            <View style={styles.reviewsList}>
              {reviews.map((rev) => (
                <View key={rev.id} style={styles.reviewItem}>
                  <View style={styles.reviewAuthorRow}>
                    <View style={styles.reviewAvatar}>
                      <Ionicons name="person-outline" size={16} color="#64748B" />
                    </View>
                    <View>
                      <Text style={styles.reviewAuthorName}>Comprador</Text>
                      <Text style={styles.reviewDate}>{new Date(rev.created_at).toLocaleDateString('es-AR')}</Text>
                    </View>
                  </View>
                  <View style={styles.reviewStarsRow}>
                    {Array.from({ length: Math.max(0, Math.min(5, rev.rating)) }).map((_, sIdx) => (
                      <EstrellaIcon key={sIdx} width={13} height={13} />
                    ))}
                  </View>
                  <Text style={styles.reviewComment}>{rev.comment}</Text>
                </View>
              ))}
            </View>

          </View>

          {/* 12. Sigue explorando (Tags de búsqueda) */}
          <View style={styles.exploreSection}>
            <Text style={styles.exploreTitle}>Sigue explorando</Text>
            <View style={styles.chipsWrapper}>
              {[product.category?.name || 'Varios', conditionLabel].map((chip, idx) => (
                <View key={idx} style={styles.chipPill}>
                  <Text style={styles.chipPillText}>{chip}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity style={styles.reportLink} activeOpacity={0.7}>
              <Text style={styles.reportLinkText}>Denunciar producto</Text>
            </TouchableOpacity>
          </View>

          {/* 13. Más como esto (Productos Relacionados) */}
          {(!!relatedProducts.length || relatedLoading || !!relatedError) && <View style={styles.relatedSection}>
            <Text style={styles.relatedTitle}>Más como esto</Text>
            {relatedLoading && <View style={styles.refreshStatus} role="status" accessibilityLiveRegion="polite"><ActivityIndicator color="#0D9488" /><Text>Cargando productos relacionados...</Text></View>}
            {!!relatedError && <Text accessibilityRole="alert">{relatedError}</Text>}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.relatedScroll}>
              {relatedProducts.map((rel) => (
                <TouchableOpacity key={rel.id} style={styles.relatedCard} onPress={() => router.push({ pathname: '/modal', params: { productId: rel.id } })}>
                  {rel.cover_image ? <Image source={{ uri: rel.cover_image }} style={styles.relatedImage} /> : <View style={[styles.relatedImage, { backgroundColor: '#F1F5F9' }]} />}
                  <Text style={styles.relatedCardTitle} numberOfLines={1}>
                    {rel.title}
                  </Text>
                  <Text style={styles.relatedCardSpecs} numberOfLines={1}>
                    {CONDITION_LABELS[rel.condition] || rel.condition}
                  </Text>
                  <Text style={styles.relatedCardPrice}>{formatProductPrice(rel.price, rel.currency)}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>}

        </ScrollView>
      )}

      {/* 14. ACCIONES FIJAS FUERA DEL SCROLL, ENCIMA DE LA NAVEGACIÓN */}
      {product && !error && (
        <View testID="product-actions" style={styles.actionBar}>
          {isOwner ? <>
            <TouchableOpacity style={styles.offerBtn} disabled={loading} onPress={() => router.push({ pathname: '/edit-product', params: { productId: product.id } })}>
              <Text style={styles.offerBtnText}>Editar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.buyBtn} disabled={loading} onPress={() => { setDeleteError(null); setShowDelete(true); }}>
              <Text style={styles.buyBtnText}>Eliminar</Text>
            </TouchableOpacity>
          </> : product.status === 'activo' ? <>
          <TouchableOpacity
            style={styles.offerBtn}
            activeOpacity={0.8}
            onPress={handleOpenChat}
            disabled={loading}
          >
            <Text style={styles.offerBtnText}>Hacer oferta</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.buyBtn}
            activeOpacity={0.85}
            onPress={handleBuyProduct}
            disabled={loading}
          >
            <Text style={styles.buyBtnText}>Comprar</Text>
          </TouchableOpacity>
          </> : <Text style={styles.productSpecs}>Esta publicación está {STATUS_LABELS[product.status]?.toLowerCase() || product.status}.</Text>}
        </View>
      )}
      <ProductDialog visible={showDelete} title="Eliminar publicación" message="El producto dejará de aparecer en el catálogo y en Mis productos. Se conservará su registro mediante una baja lógica." busy={deleting} error={deleteError} onCancel={() => setShowDelete(false)} onConfirm={removeProduct} />

      {/* 15. BARRA DE NAVEGACIÓN INFERIOR SOLTAPP */}
      <View testID="product-navigation" style={styles.bottomNavContainer}>
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem} onPress={() => router.push('/home')} activeOpacity={0.7}>
            <HomeIcon width={22} height={22} stroke="#9098B1" />
            <Text style={styles.navLabel}>Inicio</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => router.push({ pathname: '/home', params: { tab: 'favorites' } } as any)} activeOpacity={0.7}>
            <CorazonIcon width={22} height={22} fill="#9098B1" />
            <Text style={styles.navLabel}>Favoritos</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => router.push({ pathname: '/home', params: { tab: 'upload' } } as any)} activeOpacity={0.7}>
            <MasIcon width={22} height={22} stroke="#9098B1" />
            <Text style={styles.navLabel}>Subir</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => router.push({ pathname: '/home', params: { tab: 'inbox' } } as any)} activeOpacity={0.7}>
            <MailIcon width={22} height={22} stroke="#9098B1" />
            <Text style={styles.navLabel}>Buzón</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => router.push({ pathname: '/home', params: { tab: 'profile' } } as any)} activeOpacity={0.7}>
            <AvatarIcon width={22} height={22} fill="#9098B1" />
            <Text style={styles.navLabel}>Perfil</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const PRIMARY_COLOR = '#1DE9B6';
const TEXT_DARK = '#1F232E';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 8,
  },
  backButton: {
    padding: 4,
    marginRight: -4,
  },
  logoWrapper: {
    width: 36,
    height: 36,
    backgroundColor: '#3BD7C2',
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#D8DEE6',
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 8,
  },
  searchPlaceholder: {
    fontSize: 12,
    color: '#9098B1',
    flex: 1,
  },
  headerRightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconButton: {
    padding: 2,
  },
  avatarPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F232E',
  },
  centerWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  refreshStatus: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  errorText: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: '600',
    color: '#1F232E',
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 16,
    backgroundColor: '#3BD7C2',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  retryBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F232E',
  },
  scroll: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    gap: 12,
  },
  heroGalleryContainer: {
    width: '100%',
    aspectRatio: 1.2,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F1F5F9',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  sliderNextBtn: {
    position: 'absolute',
    right: 12,
    top: '50%',
    marginTop: -16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  counterBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(31, 35, 46, 0.75)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  counterBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  favBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 16,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },
  favBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F232E',
  },
  productTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F232E',
    marginTop: 4,
  },
  productSpecs: {
    fontSize: 13,
    color: '#64748B',
    marginTop: -4,
  },
  productPrice: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F232E',
  },
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 12,
    backgroundColor: '#FFFFFF',
    gap: 10,
  },
  sellerAvatarWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  sellerAvatarImg: {
    width: '100%',
    height: '100%',
  },
  sellerAvatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sellerAvatarInitial: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sellerInfoCol: {
    flex: 1,
  },
  sellerName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F232E',
  },
  sellerRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 3,
  },
  sellerRatingNumber: {
    fontSize: 11,
    color: '#64748B',
    marginLeft: 4,
  },
  chatBtnOutline: {
    borderWidth: 1.5,
    borderColor: '#1F232E',
    paddingVertical: 5,
    paddingHorizontal: 16,
    borderRadius: 18,
  },
  chatBtnOutlineText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F232E',
  },
  categoryPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryPill: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  categoryPillText: {
    fontSize: 12,
    color: '#64748B',
  },
  accordionBox: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 14,
    backgroundColor: '#FFFFFF',
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accordionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F232E',
  },
  accordionBodyText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 20,
    marginTop: 10,
  },
  detailsGrid: {
    marginTop: 10,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 0.5,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 6,
  },
  detailKey: {
    flex: 1,
    fontSize: 13,
    color: '#64748B',
  },
  detailValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 13,
    fontWeight: '600',
    color: '#1F232E',
  },
  shippingBox: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 14,
    backgroundColor: '#FFFFFF',
    gap: 10,
  },
  shippingBadgeRow: {
    flexDirection: 'row',
  },
  shippingTagBadge: {
    backgroundColor: '#1F232E',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  shippingTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  shippingFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shippingFeatureText: {
    fontSize: 13,
    color: '#1F232E',
    fontWeight: '500',
  },
  metadataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  metadataText: {
    fontSize: 12,
    color: '#64748B',
  },
  viewsCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewsCountText: {
    fontSize: 12,
    color: '#64748B',
  },
  reviewsSection: {
    marginTop: 8,
    gap: 12,
  },
  reviewsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reviewsAverage: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F232E',
  },
  reviewsSellerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F232E',
  },
  reviewsList: {
    gap: 14,
  },
  reviewItem: {
    gap: 4,
  },
  reviewAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reviewAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewAvatarText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F232E',
  },
  reviewAuthorName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F232E',
  },
  reviewDate: {
    fontSize: 10,
    color: '#9098B1',
  },
  reviewStarsRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
  },
  reviewComment: {
    fontSize: 12,
    color: '#334155',
    marginTop: 2,
  },
  allReviewsBtn: {
    borderWidth: 1.5,
    borderColor: '#3BD7C2',
    paddingVertical: 10,
    borderRadius: 24,
    alignItems: 'center',
    marginTop: 4,
  },
  allReviewsBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0D9488',
  },
  exploreSection: {
    marginTop: 12,
    gap: 10,
  },
  exploreTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F232E',
  },
  chipsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chipPill: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#FAFAFC',
  },
  chipPillText: {
    fontSize: 12,
    color: '#64748B',
  },
  reportLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  reportLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0D9488',
  },
  relatedSection: {
    marginTop: 4,
    gap: 10,
  },
  relatedTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0D9488',
  },
  relatedScroll: {
    gap: 12,
    paddingVertical: 4,
  },
  relatedCard: {
    width: 140,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderRadius: 12,
    padding: 8,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  relatedImage: {
    width: '100%',
    height: 100,
    borderRadius: 8,
  },
  relatedCardTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F232E',
    marginTop: 6,
  },
  relatedCardSpecs: {
    fontSize: 10,
    color: '#9098B1',
    marginTop: 2,
  },
  relatedCardPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0D9488',
    marginTop: 4,
  },
  actionBar: {
    flexShrink: 0,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 8,
  },
  offerBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#3BD7C2',
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  offerBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0D9488',
  },
  buyBtn: {
    flex: 1,
    backgroundColor: '#3BD7C2',
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F232E',
  },
  bottomNavContainer: {
    flexShrink: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  navLabel: {
    fontSize: 10,
    color: '#9098B1',
    marginTop: 3,
  },
});
