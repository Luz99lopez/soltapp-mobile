import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  Dimensions,
  ActivityIndicator,
  StatusBar,
  Share,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { productService, ProductDetail, ProductListItem } from '../services';

// SVGs oficiales
import IsotipoConFondo from '../../assets/svgs/isotipo con fondo.svg';
import BuscarIcon from '../../assets/svgs/Buscar.svg';
import VerTodoIcon from '../../assets/svgs/Ver todo.svg';
import EstrellaIcon from '../../assets/svgs/Estrella.svg';
import HomeIcon from '../../assets/svgs/Home.svg';
import CorazonIcon from '../../assets/svgs/Corazón.svg';
import MasIcon from '../../assets/svgs/Más.svg';
import MailIcon from '../../assets/svgs/mail.svg';
import AvatarIcon from '../../assets/svgs/Avatar.svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DEFAULT_FALLBACK_IMG = 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&q=80';

// Mock de valoraciones de vendedor para el diseño
const MOCK_SELLER_REVIEWS = [
  {
    id: 'r1',
    author: 'Marcelo H.',
    date: 'Hace 1 año',
    comment: 'Todo OK',
    stars: 5,
  },
  {
    id: 'r2',
    author: 'Edgar Wittkous',
    date: 'Hace 1 año',
    comment: 'Todo correcto rápido, fácil y puntual',
    stars: 5,
  },
  {
    id: 'r3',
    author: 'David',
    date: 'Hace 1 año',
    comment: 'Todo perfecto!!',
    stars: 5,
  },
];

// Mock de productos relacionados
const MOCK_RELATED_PRODUCTS = [
  {
    id: 'rel1',
    title: 'Zapatillas Nike Air Max 270',
    condition: 'Como nuevo · Talle 41',
    price: '$ 180.000',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80',
  },
  {
    id: 'rel2',
    title: 'Zapatillas Nike React Vision',
    condition: 'Nuevo · Talle 42',
    price: '$ 195.000',
    image: 'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=500&q=80',
  },
  {
    id: 'rel3',
    title: 'Zapatillas Nike Air Force 1',
    condition: 'Excelente · Blanco',
    price: '$ 165.000',
    image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=500&q=80',
  },
];

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
  const [favoriteCount, setFavoriteCount] = useState<number>(2);
  const [descExpanded, setDescExpanded] = useState<boolean>(true);
  const [detailsExpanded, setDetailsExpanded] = useState<boolean>(true);
  const [imageError, setImageError] = useState<boolean>(false);

  // Carga del producto desde Supabase
  useEffect(() => {
    if (!productId) {
      setError('No se especificó un ID de producto válido.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setImageError(false);
    productService
      .getProductById(productId)
      .then((data) => {
        if (data) {
          setProduct(data);
        } else {
          setError('El producto no fue encontrado o ya no está disponible.');
        }
      })
      .catch((err) => {
        console.error('[ProductDetailScreen] Error:', err);
        setError('Error al cargar la información del producto.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [productId]);

  // Formato de precio
  const formattedPrice = product
    ? product.currency?.toUpperCase() === 'USD'
      ? `USD ${Number(product.price).toLocaleString('es-AR')}`
      : `$ ${Number(product.price).toLocaleString('es-AR')}`
    : '$ 0';

  // Fallback contextual de imagen según título o categoría
  const getContextualFallback = (title: string = '', categoryName: string = '') => {
    const text = `${title} ${categoryName}`.toLowerCase();
    if (text.includes('bici') || text.includes('cannondale') || text.includes('mountain') || text.includes('r29')) {
      return 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800&q=80';
    }
    if (text.includes('figura') || text.includes('twitch') || text.includes('league') || text.includes('lol') || text.includes('juego') || text.includes('anime')) {
      return 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&q=80';
    }
    if (text.includes('iphone') || text.includes('celular') || text.includes('telefono') || text.includes('apple') || text.includes('samsung')) {
      return 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&q=80';
    }
    if (text.includes('auto') || text.includes('volkswagen') || text.includes('gol') || text.includes('vehiculo') || text.includes('coche')) {
      return 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&q=80';
    }
    if (text.includes('zapatilla') || text.includes('nike') || text.includes('ropa') || text.includes('moda')) {
      return 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80';
    }
    return DEFAULT_FALLBACK_IMG;
  };

  // Lista de imágenes con validación de URL y descarte de blobs temporales rotos
  const rawImages = product?.images && product.images.length > 0
    ? product.images.map((img) => img.image_url)
    : [DEFAULT_FALLBACK_IMG];

  const imagesList = rawImages.map((url) => {
    if (
      !url ||
      typeof url !== 'string' ||
      url.startsWith('blob:') ||
      (Platform.OS === 'web' && url.startsWith('file:///'))
    ) {
      return getContextualFallback(product?.title, product?.category?.name);
    }
    return url;
  });

  const totalImages = imagesList.length;

  // Toggle de Favorito
  const toggleFavorite = () => {
    if (isFavorite) {
      setIsFavorite(false);
      setFavoriteCount((prev) => Math.max(0, prev - 1));
    } else {
      setIsFavorite(true);
      setFavoriteCount((prev) => prev + 1);
    }
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
    if (!product) return;
    const seller = product.seller?.full_name || product.seller?.username || 'Vendedor';
    router.push({
      pathname: '/chat',
      params: {
        productTitle: product.title,
        productPrice: formattedPrice,
        sellerName: seller,
      },
    } as any);
  };

  const sellerName = product?.seller?.full_name || product?.seller?.username || 'Fer N.';
  const sellerInitial = sellerName.charAt(0).toUpperCase();
  const sellerAvatar = product?.seller?.avatar_url;

  const conditionLabel = product?.condition
    ? product.condition === 'como_nuevo'
      ? 'Como nuevo'
      : product.condition.charAt(0).toUpperCase() + product.condition.slice(1)
    : 'Como nuevo';

  // Navegar al carrito / pantalla de compras
  const handleBuyProduct = () => {
    if (!product) return;
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
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* 1. Header Navbar Superior Exacto a Soltapp */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color="#1F232E" />
        </TouchableOpacity>

        <View style={styles.logoWrapper}>
          <IsotipoConFondo width={36} height={36} />
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
      {loading ? (
        <View style={styles.centerWrapper}>
          <ActivityIndicator size="large" color="#1DE9B6" />
          <Text style={styles.loadingText}>Cargando publicación...</Text>
        </View>
      ) : error || !product ? (
        <View style={styles.centerWrapper}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error || 'Producto no encontrado'}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => router.back()}>
            <Text style={styles.retryBtnText}>Volver al inicio</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* 2. Galería / Slider de Fotos Hero */}
          <View style={styles.heroGalleryContainer}>
            <Image
              source={{
                uri: imageError
                  ? DEFAULT_FALLBACK_IMG
                  : imagesList[currentImageIndex] || DEFAULT_FALLBACK_IMG,
              }}
              style={styles.heroImage}
              resizeMode="cover"
              onError={() => setImageError(true)}
            />

            {/* Flecha Siguiente (si hay más de 1 foto) */}
            {totalImages > 1 && (
              <TouchableOpacity style={styles.sliderNextBtn} onPress={handleNextImage} activeOpacity={0.8}>
                <Ionicons name="chevron-forward" size={18} color="#1F232E" />
              </TouchableOpacity>
            )}

            {/* Contador de fotos (ej: 1/4) */}
            <View style={styles.counterBadge}>
              <Text style={styles.counterBadgeText}>
                {currentImageIndex + 1}/{totalImages}
              </Text>
            </View>

            {/* Botón de Favorito */}
            <TouchableOpacity style={styles.favBadge} onPress={toggleFavorite} activeOpacity={0.85}>
              <Ionicons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={16}
                color={isFavorite ? '#EF4444' : '#1F232E'}
              />
              <Text style={styles.favBadgeText}>{favoriteCount}</Text>
            </TouchableOpacity>
          </View>

          {/* 3. Título y Subtítulo */}
          <Text style={styles.productTitle}>{product.title}</Text>
          <Text style={styles.productSpecs}>
            {conditionLabel} · {product.category?.name || 'Varios'} · {product.location || 'Pilar'}
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
                <EstrellaIcon width={13} height={13} />
                <EstrellaIcon width={13} height={13} />
                <EstrellaIcon width={13} height={13} />
                <EstrellaIcon width={13} height={13} />
                <EstrellaIcon width={13} height={13} />
                <Text style={styles.sellerRatingNumber}>5 (3)</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.chatBtnOutline} onPress={handleOpenChat} activeOpacity={0.75}>
              <Text style={styles.chatBtnOutlineText}>Chat</Text>
            </TouchableOpacity>
          </View>

          {/* 6. Tags / Categorías en Pills */}
          <View style={styles.categoryPillsRow}>
            <View style={styles.categoryPill}>
              <Text style={styles.categoryPillText}>{product.category?.name || 'Tecnología'}</Text>
            </View>
            <View style={styles.categoryPill}>
              <Text style={styles.categoryPillText}>Artículos de {product.location || 'Pilar'}</Text>
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
                  <Text style={styles.detailValue}>{product.location || 'Pilar'}</Text>
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
              <Text style={styles.shippingFeatureText}>{product.location || 'Pilar, Buenos Aires'}</Text>
            </View>

            <View style={styles.shippingFeatureRow}>
              <Ionicons name="shield-checkmark" size={16} color="#0D9488" />
              <Text style={styles.shippingFeatureText}>Reserva segura con la app</Text>
            </View>
          </View>

          {/* 10. Metadata de la publicación (Visitas y fecha) */}
          <View style={styles.metadataRow}>
            <Text style={styles.metadataText}>Publicado recientemente</Text>
            <View style={styles.viewsCountRow}>
              <Ionicons name="eye-outline" size={15} color="#64748B" />
              <Text style={styles.viewsCountText}>348</Text>
            </View>
          </View>

          {/* 11. Sección de Valoraciones del Vendedor */}
          <View style={styles.reviewsSection}>
            <View style={styles.reviewsHeaderRow}>
              <EstrellaIcon width={18} height={18} />
              <Text style={styles.reviewsAverage}>5</Text>
              <Text style={styles.reviewsSellerTitle}>{sellerName} valoraciones</Text>
            </View>

            {/* Lista de valoraciones */}
            <View style={styles.reviewsList}>
              {MOCK_SELLER_REVIEWS.map((rev) => (
                <View key={rev.id} style={styles.reviewItem}>
                  <View style={styles.reviewAuthorRow}>
                    <View style={styles.reviewAvatar}>
                      <Text style={styles.reviewAvatarText}>{rev.author.charAt(0)}</Text>
                    </View>
                    <View>
                      <Text style={styles.reviewAuthorName}>{rev.author}</Text>
                      <Text style={styles.reviewDate}>{rev.date}</Text>
                    </View>
                  </View>
                  <View style={styles.reviewStarsRow}>
                    {Array.from({ length: rev.stars }).map((_, sIdx) => (
                      <EstrellaIcon key={sIdx} width={13} height={13} />
                    ))}
                  </View>
                  <Text style={styles.reviewComment}>{rev.comment}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity style={styles.allReviewsBtn} activeOpacity={0.75}>
              <Text style={styles.allReviewsBtnText}>Ver todas las valoraciones</Text>
            </TouchableOpacity>
          </View>

          {/* 12. Sigue explorando (Tags de búsqueda) */}
          <View style={styles.exploreSection}>
            <Text style={styles.exploreTitle}>Sigue explorando</Text>
            <View style={styles.chipsWrapper}>
              {['Computadoras', 'Mini PCs', 'Computadoras Desktop', 'Computadoras Gamer', 'Macbook', 'Hardware'].map((chip, idx) => (
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
          <View style={styles.relatedSection}>
            <Text style={styles.relatedTitle}>Más como esto</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.relatedScroll}>
              {MOCK_RELATED_PRODUCTS.map((rel) => (
                <View key={rel.id} style={styles.relatedCard}>
                  <Image source={{ uri: rel.image }} style={styles.relatedImage} />
                  <Text style={styles.relatedCardTitle} numberOfLines={1}>
                    {rel.title}
                  </Text>
                  <Text style={styles.relatedCardSpecs} numberOfLines={1}>
                    {rel.condition}
                  </Text>
                  <Text style={styles.relatedCardPrice}>{rel.price}</Text>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Espacio para la barra de botones fija */}
          <View style={{ height: 80 }} />
        </ScrollView>
      )}

      {/* 14. BARRA FLOTANTE FIJA: HACER OFERTA / COMPRAR */}
      {product && (
        <View style={styles.floatingActionBar}>
          <TouchableOpacity
            style={styles.offerBtn}
            activeOpacity={0.8}
            onPress={handleOpenChat}
          >
            <Text style={styles.offerBtnText}>Hacer oferta</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.buyBtn}
            activeOpacity={0.85}
            onPress={handleBuyProduct}
          >
            <Text style={styles.buyBtnText}>Comprar</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 15. BARRA DE NAVEGACIÓN INFERIOR SOLTAPP */}
      <View style={styles.bottomNavContainer}>
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
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    gap: 12,
  },
  heroGalleryContainer: {
    width: '100%',
    height: 240,
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
    fontSize: 13,
    color: '#64748B',
  },
  detailValue: {
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
  floatingActionBar: {
    position: 'absolute',
    bottom: 58,
    left: 0,
    right: 0,
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
