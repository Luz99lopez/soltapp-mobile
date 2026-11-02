import React, { useCallback, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image,
  Modal,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { meetupOrderService } from '../services/meetupOrderService';
import { supabase } from '../supabase';
import { ActivityIndicator } from 'react-native';
import { productService } from '../services/productService';
import type { ProductDetail } from '../types/database.types';
import { CONDITION_LABELS, formatProductPrice } from '../utils/productPresentation';

// Colores oficiales de Soltapp
const PRIMARY_TEAL = '#3BD7C2';
const TEXT_DARK = '#1F232E';

export type PaymentMethod = 'qr_soltapp' | 'efectivo';

export default function CartScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    productId?: string;
    sellerId?: string;
    title?: string;
    subtitle?: string;
    condition?: string;
    price?: string;
    sellerName?: string;
    sellerAvatar?: string;
    imageUri?: string;
  }>();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [productLoading, setProductLoading] = useState(!!params.productId);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [buyerId, setBuyerId] = useState('guest');
  const purchasePending = useRef(false);
  useFocusEffect(useCallback(() => {
    let active = true;
    setPurchaseError(null);
    setProduct(null);
    if (!params.productId) { setProductLoading(false); return; }
    setProductLoading(true);
    productService.getProductById(params.productId).then(data => {
      if (!data || data.status !== 'activo') throw new Error('El producto ya no está disponible.');
      if (active) setProduct(data);
    }).catch(err => { if (active) setPurchaseError(err.message || 'No se pudo cargar el producto.'); })
      .finally(() => { if (active) setProductLoading(false); });
    return () => { active = false; };
  }, [params.productId]));

  // Para publicaciones reales, los datos se leen por ID, sin confiar en el precio de la URL.
  const title = product?.title || params.title || 'Zelda Breath of the Wild';
  const subtitle = params.productId ? '' : params.subtitle || '(Switch)';
  const condition = product ? CONDITION_LABELS[product.condition] : params.condition || 'Como nuevo';
  const price = product ? formatProductPrice(product.price, product.currency) : params.price || '$25.000';
  const sellerName = product ? product.seller?.full_name || product.seller?.username || 'Vendedor' : params.sellerName || 'Carlos M.';
  const sellerAvatar = product ? product.seller?.avatar_url : params.sellerAvatar || null;
  const imageUri = product ? (product.images.find(img => img.is_cover) || product.images[0])?.image_url : params.imageUri || null;

  // Estado del método de pago (por defecto: Pago seguro por soltapp)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo');
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [isCreatingOrder, setIsCreatingOrder] = useState<boolean>(false);
  const [createdOrderId, setCreatedOrderId] = useState<string>('');

  // Cálculos de resumen
  const subtotalText = price;
  const totalText = subtotalText;

  const handleConfirmPurchase = async () => {
    if (purchasePending.current || (params.productId && !product)) return;
    purchasePending.current = true;
    try {
      setIsCreatingOrder(true);
      setPurchaseError(null);
      const { data: authData } = await supabase.auth.getUser();
      setBuyerId(authData.user?.id || 'guest');
      const currentBuyerName =
        authData?.user?.user_metadata?.full_name ||
        authData?.user?.user_metadata?.name ||
        'Manuel Sans';

      const newOrder = await meetupOrderService.createMeetupOrder(
        params.productId,
        product?.seller_id || params.sellerId,
        {
          title,
          price,
          sellerName,
          buyerName: currentBuyerName,
          imageUri: imageUri || '',
        },
        { requireRemote: !!params.productId }
      );
      if (newOrder?.id) {
        setCreatedOrderId(newOrder.id);
        setShowConfirmModal(true);
      } else {
        throw new Error('No se recibió una orden válida.');
      }
    } catch (e) {
      setPurchaseError(e instanceof Error ? e.message : 'No se pudo confirmar la compra.');
    } finally {
      purchasePending.current = false;
      setIsCreatingOrder(false);
    }
  };

  const handleGoToOrderFlow = () => {
    setShowConfirmModal(false);
    router.push({
      pathname: '/order/[id]',
      params: {
        id: createdOrderId,
        role: 'buyer',
        title,
        price,
        sellerName,
        sellerId: product?.seller_id || params.sellerId || '',
        imageUri: imageUri || '',
      },
    } as any);
  };

  const handleGoToChat = () => {
    setShowConfirmModal(false);
    router.push({
      pathname: '/chat',
      params: {
        productId: params.productId || '',
        sellerId: product?.seller_id || params.sellerId || '',
        buyerId,
        imageUri: imageUri || '',
        productTitle: title,
        productPrice: price,
        sellerName: sellerName,
      },
    } as any);
  };

  const handleGoHome = () => {
    setShowConfirmModal(false);
    router.push('/home' as any);
  };

  if (params.productId && !product) {
    return <SafeAreaView style={styles.safeArea}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.canGoBack() ? router.back() : router.replace('/home')}><Text>Volver</Text></TouchableOpacity>
      {productLoading ? <View role="status" accessibilityLiveRegion="polite" style={{ padding: 24, gap: 12, alignItems: 'center' }}><ActivityIndicator color={PRIMARY_TEAL} /><Text>Cargando datos de la compra...</Text></View> : <Text accessibilityRole="alert" style={{ padding: 24, color: '#B91C1C' }}>{purchaseError || 'Producto no disponible.'}</Text>}
    </SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* 1. Header con flecha atrás y Título Compras */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={26} color={TEXT_DARK} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Compras</Text>

        <View style={styles.headerPlaceholder} />
      </View>

      {/* 2. Barra del Vendedor: Articulo de: ... Carlos M. (Avatar) */}
      <View style={styles.sellerBar}>
        <Text style={styles.sellerBarLabel}>Articulo de:</Text>

        <View style={styles.sellerInfoRow}>
          <Text style={styles.sellerNameText}>{sellerName}</Text>
          <View style={styles.sellerAvatarCircle}>
            {sellerAvatar ? (
              <Image source={{ uri: sellerAvatar }} style={styles.sellerAvatarImg} />
            ) : (
              <View style={styles.sellerAvatarPlaceholder} />
            )}
          </View>
        </View>
      </View>
      <View style={styles.horizontalDivider} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 3. Tarjeta del Producto */}
        <View style={styles.productCard}>
          <View style={styles.productImageWrapper}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.productImage} resizeMode="cover" />
            ) : (
              <View style={styles.productImagePlaceholder} />
            )}
          </View>

          <View style={styles.productDetailsCol}>
            <Text style={styles.productTitle}>{title}</Text>
            {subtitle ? <Text style={styles.productSubtitle}>{subtitle}</Text> : null}
            <Text style={styles.productCondition}>{condition}</Text>
            <Text style={styles.productPrice}>{price}</Text>
          </View>
        </View>

        {/* 4. Sección: Método de pago */}
        <View style={styles.paymentSection}>
          <Text style={styles.paymentSectionTitle}>Método de pago</Text>

          <View style={styles.paymentOptionsCard}>
            {/* Opción 1: Pago seguro por soltapp (BLOQUEADO / PRÓXIMAMENTE) */}
            <TouchableOpacity
              style={[styles.paymentOptionRow, styles.disabledOptionRow]}
              activeOpacity={0.8}
              onPress={() => {
                Alert.alert(
                  'Próximamente',
                  'El módulo de pago con custodia y retención de dinero dentro de Soltapp está en desarrollo y estará disponible próximamente. Por el momento, todos los tratos se realizan cara a cara.'
                );
              }}
            >
              <View style={styles.radioContainer}>
                <View style={styles.disabledRadioCircle}>
                  <Ionicons name="lock-closed" size={11} color="#94A3B8" />
                </View>
              </View>

              <View style={styles.paymentTextCol}>
                <View style={styles.optionTitleRow}>
                  <Text style={[styles.paymentOptionTitle, styles.disabledText]}>
                    Pago seguro por soltapp
                  </Text>
                  <View style={styles.comingSoonBadge}>
                    <Text style={styles.comingSoonBadgeText}>Próximamente</Text>
                  </View>
                </View>
                <Text style={[styles.paymentOptionSubtitle, styles.disabledText]}>
                  (Retención de dinero)
                </Text>
              </View>
            </TouchableOpacity>

            {/* Opción 2: Pago en efectivo al encontrarse (ACTIVO) */}
            <TouchableOpacity
              style={[styles.paymentOptionRow, { marginTop: 18 }]}
              activeOpacity={0.8}
              onPress={() => setPaymentMethod('efectivo')}
            >
              <View style={styles.radioContainer}>
                <View style={styles.checkedCircle}>
                  <Ionicons name="checkmark" size={15} color="#1F232E" />
                </View>
              </View>

              <View style={styles.paymentTextCol}>
                <Text style={styles.paymentOptionTitle}>Pago en efectivo al encontrarse</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* 5. Desglose de Precios */}
        <View style={styles.summarySection}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal (1 producto)</Text>
            <Text style={styles.summaryValue}>{subtotalText}</Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalValue}>{totalText}</Text>
          </View>
        </View>

        {/* 6. Botón CTA Confirmar trato en persona */}
        <View style={styles.ctaContainer}>
          {!!purchaseError && <Text accessibilityRole="alert" style={{ color: '#B91C1C', marginBottom: 12 }}>{purchaseError}</Text>}
          <TouchableOpacity
            style={styles.confirmButton}
            activeOpacity={0.85}
            onPress={handleConfirmPurchase}
            disabled={isCreatingOrder}
          >
            {isCreatingOrder ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.confirmButtonText}>Confirmar trato en persona</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* 7. Modal de Confirmación de Trato */}
      <Modal
        visible={showConfirmModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconCircle}>
              <Ionicons
                name={paymentMethod === 'qr_soltapp' ? 'qr-code-outline' : 'shield-checkmark-outline'}
                size={34}
                color={PRIMARY_TEAL}
              />
            </View>

            <Text style={styles.modalTitle}>¡Trato confirmado!</Text>

            <Text style={styles.modalMessage}>
              `Has acordado encontrarte con ${sellerName} para revisar el producto y pagar en efectivo o transferencia externa directa. Recuerden coordinar un punto público y seguro para realizar el encuentro.`
            </Text>

            <TouchableOpacity
              style={styles.modalPrimaryBtn}
              activeOpacity={0.85}
              onPress={handleGoToOrderFlow}
            >
              <Ionicons name="shield-checkmark-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.modalPrimaryBtnText}>Ver Seguimiento y Validación QR</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalSecondaryBtn, { backgroundColor: '#F3F4F6', borderWidth: 0, marginTop: 10 }]}
              activeOpacity={0.85}
              onPress={handleGoToChat}
            >
              <Ionicons name="chatbubbles-outline" size={18} color="#1F232E" style={{ marginRight: 8 }} />
              <Text style={[styles.modalSecondaryBtnText, { color: '#1F232E' }]}>Coordinar con {sellerName}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalSecondaryBtn, { marginTop: 8 }]}
              activeOpacity={0.7}
              onPress={handleGoHome}
            >
              <Text style={styles.modalSecondaryBtnText}>Volver a Inicio</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // 1. Header
  header: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: TEXT_DARK,
    textAlign: 'center',
  },
  headerPlaceholder: {
    width: 40,
  },

  // 2. Seller Bar
  sellerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
  },
  sellerBarLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: TEXT_DARK,
  },
  sellerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sellerNameText: {
    fontSize: 16,
    fontWeight: '800',
    color: TEXT_DARK,
  },
  sellerAvatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#CBD5E1',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sellerAvatarImg: {
    width: 34,
    height: 34,
  },
  sellerAvatarPlaceholder: {
    width: 34,
    height: 34,
    backgroundColor: '#CBD5E1',
  },
  horizontalDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },

  // ScrollView
  scrollView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // 3. Product Card
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  productImageWrapper: {
    width: 100,
    height: 100,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  productImage: {
    width: 100,
    height: 100,
  },
  productImagePlaceholder: {
    width: 100,
    height: 100,
    backgroundColor: '#D9D9D9',
  },
  productDetailsCol: {
    marginLeft: 18,
    flex: 1,
    justifyContent: 'center',
  },
  productTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_DARK,
    lineHeight: 22,
  },
  productSubtitle: {
    fontSize: 15,
    fontWeight: '500',
    color: TEXT_DARK,
    marginTop: 2,
  },
  productCondition: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 3,
  },
  productPrice: {
    fontSize: 17,
    fontWeight: '800',
    color: TEXT_DARK,
    marginTop: 4,
  },

  // 4. Payment Method
  paymentSection: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  paymentSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_DARK,
    marginBottom: 12,
  },
  paymentOptionsCard: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  paymentOptionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  disabledOptionRow: {
    opacity: 0.55,
  },
  disabledRadioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  optionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  comingSoonBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  comingSoonBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#92400E',
    letterSpacing: 0.2,
  },
  disabledText: {
    color: '#94A3B8',
  },
  radioContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  checkedCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: PRIMARY_TEAL,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uncheckedCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#D1D5DB',
  },
  paymentTextCol: {
    flex: 1,
  },
  paymentOptionTitle: {
    fontSize: 14.5,
    fontWeight: '600',
    color: TEXT_DARK,
  },
  paymentOptionSubtitle: {
    fontSize: 14,
    color: TEXT_DARK,
    marginTop: 2,
  },
  protectionText: {
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 4,
  },

  // 5. Summary
  summarySection: {
    paddingHorizontal: 20,
    marginTop: 28,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: 15,
    color: TEXT_DARK,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '800',
    color: TEXT_DARK,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#CBD5E1',
    marginVertical: 14,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: TEXT_DARK,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '800',
    color: TEXT_DARK,
  },

  // 6. Confirm CTA Button
  ctaContainer: {
    marginTop: 26,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: PRIMARY_TEAL,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
    shadowColor: PRIMARY_TEAL,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // 7. Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  modalIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: TEXT_DARK,
    marginBottom: 10,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
  },
  modalPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY_TEAL,
    width: '100%',
    height: 48,
    borderRadius: 24,
    marginBottom: 12,
  },
  modalPrimaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalSecondaryBtn: {
    paddingVertical: 8,
  },
  modalSecondaryBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
});
