import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MeetupOrder, OrderStatus } from '../types/order.types';
import { meetupOrderService } from '../services/meetupOrderService';
import { MeetupSellerQRModal } from '../components/meetup/MeetupSellerQRModal';
import { MeetupBuyerScannerModal } from '../components/meetup/MeetupBuyerScannerModal';
import { MeetupIssueModal } from '../components/meetup/MeetupIssueModal';
import { MeetupReviewModal } from '../components/meetup/MeetupReviewModal';
import { supabase } from '../supabase';

const PRIMARY_TEAL = '#3BD7C2';
const TEXT_DARK = '#1F232E';
const MUTED_GRAY = '#6C757D';
const BORDER_COLOR = '#E5E7EB';
const SUCCESS_GREEN = '#10B981';
const DANGER_RED = '#EF4444';
const WARNING_AMBER = '#F59E0B';

export const MeetupOrderScreen: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id?: string;
    role?: 'buyer' | 'seller';
    title?: string;
    price?: string;
    sellerName?: string;
    imageUri?: string;
  }>();

  const orderId = params.id || 'demo-order-1';

  const [order, setOrder] = useState<MeetupOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentRole, setCurrentRole] = useState<'buyer' | 'seller'>((params.role as any) || 'buyer');

  // Modales
  const [showSellerQRModal, setShowSellerQRModal] = useState(false);
  const [showBuyerScannerModal, setShowBuyerScannerModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Carga inicial de la orden
  useEffect(() => {
    loadOrder();
  }, [orderId]);

  // Suscripción Realtime
  useEffect(() => {
    if (!orderId) return;

    const unsubscribe = meetupOrderService.subscribeToOrder(orderId, (updatedFields) => {
      console.log('[MeetupOrderScreen] Actualización Realtime:', updatedFields);
      setOrder((prev) => {
        if (!prev) return null;
        const merged = { ...prev, ...updatedFields } as MeetupOrder;
        // Si acaba de completarse, abrir modal de review
        if (updatedFields.status === 'COMPLETED' && prev.status !== 'COMPLETED') {
          setTimeout(() => setShowReviewModal(true), 600);
        }
        return merged;
      });
    });

    return () => {
      unsubscribe();
    };
  }, [orderId]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const data = await meetupOrderService.getOrderById(orderId);
      
      // Merge con params pasados desde CartScreen si faltan datos en el mock
      const enrichedOrder: MeetupOrder = {
        ...data,
        product: {
          id: data.product?.id || 'prod-default',
          title: params.title || data.product?.title || 'Zelda Breath of the Wild (Switch)',
          price: params.price || data.product?.price || '$25.000',
          condition: data.product?.condition || 'Como nuevo',
          images: params.imageUri ? [params.imageUri] : data.product?.images,
        },
        seller: {
          id: data.seller?.id || 'seller-1',
          full_name: params.sellerName || data.seller?.full_name || 'Carlos M.',
        },
        buyer: {
          id: data.buyer?.id || 'buyer-1',
          full_name: 'Tú (Comprador)',
        },
      };

      setOrder(enrichedOrder);

      // Si el usuario actual es el seller_id, ajustar el rol por defecto
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user && data.seller_id === authData.user.id) {
        setCurrentRole('seller');
      }
    } catch (err: any) {
      console.warn('Error cargando orden:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOrderUpdated = (updatedOrder: MeetupOrder) => {
    setOrder(updatedOrder);
    if (updatedOrder.status === 'COMPLETED') {
      setTimeout(() => setShowReviewModal(true), 600);
    }
  };

  const handleGoToChat = () => {
    router.push({
      pathname: '/chat',
      params: {
        productTitle: order?.product?.title || 'Producto',
        productPrice: String(order?.product?.price || ''),
        sellerName: order?.seller?.full_name || 'Vendedor',
      },
    } as any);
  };

  if (loading || !order) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={PRIMARY_TEAL} />
        <Text style={styles.loadingText}>Cargando estado del encuentro...</Text>
      </SafeAreaView>
    );
  }

  const isBuyer = currentRole === 'buyer';
  const isPending = order.status === 'PENDING_MEETUP';
  const isDelivered = order.status === 'DELIVERED';
  const isCompleted = order.status === 'COMPLETED';
  const isCancelled = order.status === 'CANCELLED';
  const isNoShow = order.status === 'NO_SHOW';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="chevron-back" size={26} color={TEXT_DARK} />
        </TouchableOpacity>

        <View style={styles.headerTitleCol}>
          <Text style={styles.headerTitle}>Trato en Persona</Text>
          <Text style={styles.headerSub}>Orden #{order.id.slice(0, 8)}</Text>
        </View>

        <TouchableOpacity
          style={styles.helpBtn}
          onPress={() =>
            Alert.alert(
              'Encuentro Cara a Cara',
              'Soltapp valida la presencia y entrega mediante código QR dinámico. El pago se efectúa 100% de manera externa en mano (efectivo o transferencia).'
            )
          }
        >
          <Ionicons name="help-circle-outline" size={24} color={MUTED_GRAY} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Simulador / Selector de Rol (Comprador vs Vendedor) */}
        <View style={styles.roleToggleCard}>
          <Text style={styles.roleToggleLabel}>Ver flujo como:</Text>
          <View style={styles.roleToggleButtons}>
            <TouchableOpacity
              style={[styles.roleBtn, isBuyer && styles.roleBtnActive]}
              onPress={() => setCurrentRole('buyer')}
            >
              <Ionicons
                name="person-outline"
                size={16}
                color={isBuyer ? '#FFFFFF' : MUTED_GRAY}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.roleBtnText, isBuyer && styles.roleBtnTextActive]}>
                Comprador (Lector)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.roleBtn, !isBuyer && styles.roleBtnActive]}
              onPress={() => setCurrentRole('seller')}
            >
              <Ionicons
                name="storefront-outline"
                size={16}
                color={!isBuyer ? '#FFFFFF' : MUTED_GRAY}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.roleBtnText, !isBuyer && styles.roleBtnTextActive]}>
                Vendedor (QR)
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stepper de Estados */}
        <View style={styles.stepperCard}>
          <View style={styles.stepItem}>
            <View
              style={[
                styles.stepCircle,
                (isPending || isDelivered || isCompleted) && styles.stepCircleActive,
                (isDelivered || isCompleted) && styles.stepCircleDone,
              ]}
            >
              {isDelivered || isCompleted ? (
                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
              ) : (
                <Text style={styles.stepNumberText}>1</Text>
              )}
            </View>
            <Text style={styles.stepLabel}>Encuentro</Text>
          </View>

          <View
            style={[
              styles.stepLine,
              (isDelivered || isCompleted) && styles.stepLineActive,
            ]}
          />

          <View style={styles.stepItem}>
            <View
              style={[
                styles.stepCircle,
                (isDelivered || isCompleted) && styles.stepCircleActive,
                isCompleted && styles.stepCircleDone,
              ]}
            >
              {isCompleted ? (
                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
              ) : (
                <Text
                  style={[
                    styles.stepNumberText,
                    isDelivered && { color: '#FFFFFF' },
                  ]}
                >
                  2
                </Text>
              )}
            </View>
            <Text style={styles.stepLabel}>Validación QR</Text>
          </View>

          <View style={[styles.stepLine, isCompleted && styles.stepLineActive]} />

          <View style={styles.stepItem}>
            <View style={[styles.stepCircle, isCompleted && styles.stepCircleDone]}>
              <Text style={[styles.stepNumberText, isCompleted && { color: '#FFFFFF' }]}>
                3
              </Text>
            </View>
            <Text style={styles.stepLabel}>Pago y Fin</Text>
          </View>
        </View>

        {/* Banner de Estado Especial (Si fue cancelado o no-show) */}
        {isCancelled && (
          <View style={styles.issueBannerCancelled}>
            <Ionicons name="close-circle" size={24} color={DANGER_RED} style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.issueBannerTitle}>Encuentro Cancelado</Text>
              <Text style={styles.issueBannerSubtitle}>
                {order.cancellation_reason
                  ? `Motivo: ${order.cancellation_reason}`
                  : 'Cancelado sin impacto económico.'}
              </Text>
            </View>
          </View>
        )}

        {isNoShow && (
          <View style={styles.issueBannerNoShow}>
            <Ionicons name="alert-circle" size={24} color={WARNING_AMBER} style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.issueBannerTitle}>Inasistencia Reportada (NO_SHOW)</Text>
              <Text style={styles.issueBannerSubtitle}>
                Una de las partes no asistió al encuentro acordado. Se aplicó un strike de reputación.
              </Text>
            </View>
          </View>
        )}

        {/* Tarjeta del Producto */}
        <View style={styles.productCard}>
          <View style={styles.productImgWrapper}>
            {order.product?.images?.[0] ? (
              <Image
                source={{ uri: order.product.images[0] }}
                style={styles.productImg}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.productImgPlaceholder}>
                <Ionicons name="cube-outline" size={32} color={MUTED_GRAY} />
              </View>
            )}
          </View>
          <View style={styles.productInfoCol}>
            <Text style={styles.productTitle} numberOfLines={2}>
              {order.product?.title || 'Producto'}
            </Text>
            <Text style={styles.productCondition}>{order.product?.condition || 'Usado'}</Text>
            <Text style={styles.productPrice}>{order.product?.price || '$0'}</Text>
          </View>
        </View>

        {/* Tarjeta de Contraparte con botón de Chat */}
        <View style={styles.counterpartCard}>
          <View style={styles.counterpartInfoRow}>
            <View style={styles.avatarCircle}>
              <Ionicons name="person" size={20} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.counterpartRoleLabel}>
                {isBuyer ? 'Vendedor del artículo:' : 'Comprador:'}
              </Text>
              <Text style={styles.counterpartName}>
                {isBuyer
                  ? order.seller?.full_name || 'Carlos M.'
                  : order.buyer?.full_name || 'Comprador Soltapp'}
              </Text>
            </View>

            <TouchableOpacity style={styles.chatActionBtn} onPress={handleGoToChat}>
              <Ionicons name="chatbubble-ellipses-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.chatActionBtnText}>Chat</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Aviso de Pago 100% Externo (Claridad de las Reglas) */}
        <View style={styles.securityNoticeCard}>
          <Ionicons name="shield-checkmark" size={22} color="#0D9488" style={{ marginRight: 10 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.securityNoticeTitle}>Operación Sin Manejo de Dinero</Text>
            <Text style={styles.securityNoticeText}>
              Soltapp NO procesa pagos ni cobra comisiones. El importe total se abona cara a cara en efectivo o transferencia externa en el encuentro.
            </Text>
          </View>
        </View>

        {/* SECCIÓN PRINCIPAL DE ACCIÓN SEGÚN ESTADO Y ROL */}
        <View style={styles.actionContainer}>
          {/* CASO: PENDING_MEETUP */}
          {isPending && (
            <>
              {isBuyer ? (
                /* Acción Comprador: Escanear QR */
                <View style={styles.actionBox}>
                  <Text style={styles.actionTitle}>Paso del Comprador</Text>
                  <Text style={styles.actionDesc}>
                    Revisa y prueba el producto en persona. Cuando verifiques que todo está correcto, escanea el código QR que te muestre el vendedor.
                  </Text>
                  <TouchableOpacity
                    style={styles.primaryCtaBtn}
                    activeOpacity={0.85}
                    onPress={() => setShowBuyerScannerModal(true)}
                  >
                    <Ionicons name="scan-outline" size={22} color="#FFFFFF" style={{ marginRight: 10 }} />
                    <Text style={styles.primaryCtaBtnText}>Escanear QR de Entrega</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                /* Acción Vendedor: Generar QR */
                <View style={styles.actionBox}>
                  <Text style={styles.actionTitle}>Paso del Vendedor</Text>
                  <Text style={styles.actionDesc}>
                    Muestra tu código QR dinámico al comprador para que lo escanee y valide la entrega física del producto.
                  </Text>
                  <TouchableOpacity
                    style={styles.primaryCtaBtn}
                    activeOpacity={0.85}
                    onPress={() => setShowSellerQRModal(true)}
                  >
                    <Ionicons name="qr-code-outline" size={22} color="#FFFFFF" style={{ marginRight: 10 }} />
                    <Text style={styles.primaryCtaBtnText}>Mostrar mi Código QR</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Botón de Salida / Incidencia */}
              <TouchableOpacity
                style={styles.issueButton}
                onPress={() => setShowIssueModal(true)}
              >
                <Ionicons name="flag-outline" size={16} color={MUTED_GRAY} style={{ marginRight: 6 }} />
                <Text style={styles.issueButtonText}>No se presentó / Cancelar encuentro</Text>
              </TouchableOpacity>
            </>
          )}

          {/* CASO: DELIVERED */}
          {isDelivered && (
            <View style={styles.deliveredAlertBox}>
              <View style={styles.deliveredBadgeRow}>
                <Ionicons name="checkmark-done-circle" size={26} color={SUCCESS_GREEN} />
                <Text style={styles.deliveredBadgeText}>Entrega Física Validada</Text>
              </View>

              {isBuyer ? (
                <Text style={styles.deliveredBodyText}>
                  Has validado la entrega correctamente. Ahora realiza el pago directamente al vendedor en mano. El vendedor confirmará en su app una vez recibido el dinero.
                </Text>
              ) : (
                <>
                  <Text style={styles.deliveredBodyText}>
                    El comprador escaneó el código y confirmó la entrega física. Verifica recibir el pago externo y presiona confirmar.
                  </Text>
                  <TouchableOpacity
                    style={styles.confirmPaymentCtaBtn}
                    activeOpacity={0.85}
                    onPress={() => setShowSellerQRModal(true)}
                  >
                    <Ionicons name="cash-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.confirmPaymentCtaBtnText}>Confirmar recepción del pago</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}

          {/* CASO: COMPLETED */}
          {isCompleted && (
            <View style={styles.completedAlertBox}>
              <Ionicons name="ribbon-outline" size={38} color="#0D9488" />
              <Text style={styles.completedAlertTitle}>¡Transacción Finalizada con Éxito!</Text>
              <Text style={styles.completedAlertSubtitle}>
                El encuentro se completó sin intermediarios. Califica la experiencia para ayudar a la comunidad.
              </Text>
              <TouchableOpacity
                style={styles.reviewCtaBtn}
                activeOpacity={0.85}
                onPress={() => setShowReviewModal(true)}
              >
                <Ionicons name="star" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.reviewCtaBtnText}>Dejar Valoración / Review</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modales del Flujo */}
      <MeetupSellerQRModal
        visible={showSellerQRModal}
        order={order}
        onClose={() => setShowSellerQRModal(false)}
        onOrderUpdated={handleOrderUpdated}
        onOpenIssueModal={() => setShowIssueModal(true)}
      />

      <MeetupBuyerScannerModal
        visible={showBuyerScannerModal}
        order={order}
        onClose={() => setShowBuyerScannerModal(false)}
        onOrderUpdated={handleOrderUpdated}
        onOpenIssueModal={() => setShowIssueModal(true)}
      />

      <MeetupIssueModal
        visible={showIssueModal}
        order={order}
        onClose={() => setShowIssueModal(false)}
        onOrderUpdated={handleOrderUpdated}
      />

      <MeetupReviewModal
        visible={showReviewModal}
        order={order}
        isSeller={!isBuyer}
        onClose={() => setShowReviewModal(false)}
        onSuccess={() => {
          setShowReviewModal(false);
          router.replace('/home' as any);
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: MUTED_GRAY,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
  },
  backBtn: {
    padding: 6,
    marginRight: 8,
  },
  headerTitleCol: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: TEXT_DARK,
  },
  headerSub: {
    fontSize: 12,
    color: MUTED_GRAY,
  },
  helpBtn: {
    padding: 6,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  roleToggleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  roleToggleLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: MUTED_GRAY,
    marginBottom: 8,
    marginLeft: 2,
  },
  roleToggleButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  roleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  roleBtnActive: {
    backgroundColor: PRIMARY_TEAL,
  },
  roleBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: MUTED_GRAY,
  },
  roleBtnTextActive: {
    color: '#FFFFFF',
  },
  stepperCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  stepCircleActive: {
    backgroundColor: PRIMARY_TEAL,
  },
  stepCircleDone: {
    backgroundColor: SUCCESS_GREEN,
  },
  stepNumberText: {
    fontSize: 13,
    fontWeight: '700',
    color: MUTED_GRAY,
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: TEXT_DARK,
    textAlign: 'center',
  },
  stepLine: {
    height: 2,
    flex: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 4,
    marginBottom: 20,
  },
  stepLineActive: {
    backgroundColor: SUCCESS_GREEN,
  },
  issueBannerCancelled: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  issueBannerNoShow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  issueBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_DARK,
  },
  issueBannerSubtitle: {
    fontSize: 12,
    color: MUTED_GRAY,
    marginTop: 2,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 14,
  },
  productImgWrapper: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  productImg: {
    width: '100%',
    height: '100%',
  },
  productImgPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfoCol: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  productTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT_DARK,
  },
  productCondition: {
    fontSize: 12,
    color: MUTED_GRAY,
    marginTop: 3,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: TEXT_DARK,
    marginTop: 4,
  },
  counterpartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 14,
  },
  counterpartInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#4B5563',
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterpartRoleLabel: {
    fontSize: 11,
    color: MUTED_GRAY,
  },
  counterpartName: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_DARK,
  },
  chatActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PRIMARY_TEAL,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  chatActionBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  securityNoticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#99F6E4',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  securityNoticeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F766E',
  },
  securityNoticeText: {
    fontSize: 12,
    color: '#115E59',
    marginTop: 2,
    lineHeight: 16,
  },
  actionContainer: {
    marginTop: 4,
  },
  actionBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_DARK,
  },
  actionDesc: {
    fontSize: 13,
    color: MUTED_GRAY,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 18,
    lineHeight: 18,
  },
  primaryCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY_TEAL,
    paddingVertical: 16,
    borderRadius: 16,
    width: '100%',
    shadowColor: PRIMARY_TEAL,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryCtaBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
  issueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginTop: 10,
  },
  issueButtonText: {
    fontSize: 13,
    color: MUTED_GRAY,
    textDecorationLine: 'underline',
  },
  deliveredAlertBox: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
  },
  deliveredBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  deliveredBadgeText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#065F46',
    marginLeft: 8,
  },
  deliveredBodyText: {
    fontSize: 13,
    color: '#047857',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 14,
  },
  confirmPaymentCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SUCCESS_GREEN,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    width: '100%',
  },
  confirmPaymentCtaBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  completedAlertBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  completedAlertTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: TEXT_DARK,
    marginTop: 10,
  },
  completedAlertSubtitle: {
    fontSize: 13,
    color: MUTED_GRAY,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 18,
  },
  reviewCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY_TEAL,
    paddingVertical: 14,
    borderRadius: 14,
    width: '100%',
  },
  reviewCtaBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
