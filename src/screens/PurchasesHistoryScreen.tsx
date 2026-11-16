import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  RefreshControl,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MeetupOrder } from '../types/order.types';
import { meetupOrderService } from '../services/meetupOrderService';
import { accountService, SoltappUser } from '../services/accountService';
import { MeetupReviewModal } from '../components/meetup/MeetupReviewModal';

const PRIMARY_TEAL = '#3BD7C2';
const TEXT_DARK = '#1F232E';
const MUTED_GRAY = '#6C757D';
const BORDER_COLOR = '#E5E7EB';
const SUCCESS_GREEN = '#10B981';
const WARNING_AMBER = '#F59E0B';
const CARD_BG = '#FFFFFF';
const BG_COLOR = '#F9FAFB';

export const PurchasesHistoryScreen: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: 'compras' | 'ventas' }>();

  const [activeTab, setActiveTab] = useState<'compras' | 'ventas'>(
    params.tab === 'ventas' ? 'ventas' : 'compras'
  );
  const [filterStatus, setFilterStatus] = useState<'all' | 'ongoing' | 'completed'>('all');

  const [currentUser, setCurrentUser] = useState<SoltappUser | null>(null);
  const [buyerOrders, setBuyerOrders] = useState<MeetupOrder[]>([]);
  const [sellerOrders, setSellerOrders] = useState<MeetupOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Review modal state
  const [selectedOrderForReview, setSelectedOrderForReview] = useState<MeetupOrder | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const user = await accountService.getCurrentUser();
      setCurrentUser(user);

      const [compras, ventas] = await Promise.all([
        meetupOrderService.getUserOrders('buyer', user.id),
        meetupOrderService.getUserOrders('seller', user.id),
      ]);

      setBuyerOrders(compras);
      setSellerOrders(ventas);
    } catch (e) {
      console.warn('[PurchasesHistoryScreen] Error cargando órdenes:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Sincronización en tiempo real
    const unsubscribe = meetupOrderService.subscribeToOrder('', () => {
      loadData();
    });

    const interval = setInterval(loadData, 3000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [loadData]);

  useEffect(() => {
    if (params.tab === 'ventas') {
      setActiveTab('ventas');
    } else if (params.tab === 'compras') {
      setActiveTab('compras');
    }
  }, [params.tab]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const currentList = activeTab === 'compras' ? buyerOrders : sellerOrders;

  const filteredOrders = useMemo(() => {
    return currentList.filter((order) => {
      if (filterStatus === 'ongoing') {
        return order.status === 'PENDING_MEETUP' || order.status === 'DELIVERED';
      }
      if (filterStatus === 'completed') {
        return order.status === 'COMPLETED';
      }
      return true;
    });
  }, [currentList, filterStatus]);

  const handleOpenReview = (order: MeetupOrder) => {
    setSelectedOrderForReview(order);
    setShowReviewModal(true);
  };

  const handleGoToOrder = (order: MeetupOrder) => {
    router.push({
      pathname: `/order/${order.id}`,
      params: {
        role: activeTab === 'compras' ? 'buyer' : 'seller',
        title: order.product?.title || '',
        price: order.product?.price || '',
        sellerName: order.seller?.full_name || '',
        buyerName: order.buyer?.full_name || '',
        imageUri: order.product?.images?.[0] || '',
      },
    } as any);
  };

  const handleGoToProfile = (userId?: string, userName?: string) => {
    router.push({
      pathname: '/public-profile',
      params: {
        userId: userId || '',
        userName: userName || '',
      },
    } as any);
  };

  const formatDate = (isoStr?: string) => {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING_MEETUP':
        return (
          <View style={[styles.badge, styles.badgePending]}>
            <Ionicons name="time-outline" size={13} color="#D97706" style={{ marginRight: 4 }} />
            <Text style={[styles.badgeText, { color: '#B45309' }]}>Encuentro pendiente</Text>
          </View>
        );
      case 'DELIVERED':
        return (
          <View style={[styles.badge, styles.badgeDelivered]}>
            <Ionicons name="checkmark-circle-outline" size={13} color="#0D9488" style={{ marginRight: 4 }} />
            <Text style={[styles.badgeText, { color: '#0F766E' }]}>Entrega validada</Text>
          </View>
        );
      case 'COMPLETED':
        return (
          <View style={[styles.badge, styles.badgeCompleted]}>
            <Ionicons name="ribbon-outline" size={13} color="#059669" style={{ marginRight: 4 }} />
            <Text style={[styles.badgeText, { color: '#047857' }]}>Finalizada con éxito</Text>
          </View>
        );
      case 'CANCELLED':
      case 'NO_SHOW':
        return (
          <View style={[styles.badge, styles.badgeCancelled]}>
            <Ionicons name="close-circle-outline" size={13} color="#DC2626" style={{ marginRight: 4 }} />
            <Text style={[styles.badgeText, { color: '#B91C1C' }]}>
              {status === 'NO_SHOW' ? 'No se presentó' : 'Cancelada'}
            </Text>
          </View>
        );
      default:
        return (
          <View style={[styles.badge, styles.badgePending]}>
            <Text style={styles.badgeText}>{status}</Text>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="chevron-back" size={26} color={TEXT_DARK} />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Mis Transacciones</Text>
          <Text style={styles.headerSubtitle}>
            Registro de compras y ventas cara a cara
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            style={[styles.helpButton, { marginRight: 4 }]}
            onPress={() => router.replace('/home' as any)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="home-outline" size={22} color={TEXT_DARK} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.helpButton}
            onPress={() =>
              alert(
                'Encuentros Soltapp\n\nAquí tienes el historial completo de tus compras y ventas pactadas en persona. Puedes consultar el estado del encuentro, volver a ver el código QR o calificar a la otra parte.'
              )
            }
          >
            <Ionicons name="help-circle-outline" size={24} color={MUTED_GRAY} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs Selector: Mis Compras / Mis Ventas */}
      <View style={styles.segmentedContainer}>
        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'compras' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('compras')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="bag-handle-outline"
            size={18}
            color={activeTab === 'compras' ? '#0D9488' : MUTED_GRAY}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.segmentText, activeTab === 'compras' && styles.segmentTextActive]}>
            Mis Compras
          </Text>
          {buyerOrders.length > 0 && (
            <View style={[styles.countBadge, activeTab === 'compras' && styles.countBadgeActive]}>
              <Text
                style={[
                  styles.countBadgeText,
                  activeTab === 'compras' && styles.countBadgeTextActive,
                ]}
              >
                {buyerOrders.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'ventas' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('ventas')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="storefront-outline"
            size={18}
            color={activeTab === 'ventas' ? '#0D9488' : MUTED_GRAY}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.segmentText, activeTab === 'ventas' && styles.segmentTextActive]}>
            Mis Ventas
          </Text>
          {sellerOrders.length > 0 && (
            <View style={[styles.countBadge, activeTab === 'ventas' && styles.countBadgeActive]}>
              <Text
                style={[
                  styles.countBadgeText,
                  activeTab === 'ventas' && styles.countBadgeTextActive,
                ]}
              >
                {sellerOrders.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Chips de filtro: Todas / En curso / Completadas */}
      <View style={styles.chipsRow}>
        <TouchableOpacity
          style={[styles.chip, filterStatus === 'all' && styles.chipActive]}
          onPress={() => setFilterStatus('all')}
        >
          <Text style={[styles.chipText, filterStatus === 'all' && styles.chipTextActive]}>
            Todas ({currentList.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.chip, filterStatus === 'ongoing' && styles.chipActive]}
          onPress={() => setFilterStatus('ongoing')}
        >
          <Text style={[styles.chipText, filterStatus === 'ongoing' && styles.chipTextActive]}>
            En curso
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.chip, filterStatus === 'completed' && styles.chipActive]}
          onPress={() => setFilterStatus('completed')}
        >
          <Text style={[styles.chipText, filterStatus === 'completed' && styles.chipTextActive]}>
            Completadas
          </Text>
        </TouchableOpacity>
      </View>

      {/* Lista de Órdenes */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY_TEAL} />
          <Text style={styles.loadingText}>Cargando tus transacciones...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[PRIMARY_TEAL]}
              tintColor={PRIMARY_TEAL}
            />
          }
        >
          {filteredOrders.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons
                  name={activeTab === 'compras' ? 'bag-handle-outline' : 'storefront-outline'}
                  size={46}
                  color={PRIMARY_TEAL}
                />
              </View>
              <Text style={styles.emptyTitle}>
                {activeTab === 'compras'
                  ? 'Aún no tienes compras registradas'
                  : 'Aún no tienes ventas registradas'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === 'compras'
                  ? 'Cuando acuerdes la compra cara a cara de un producto del catálogo, quedará registrado permanentemente en tu cuenta aquí.'
                  : 'Cuando un comprador pacte una compra sobre una de tus publicaciones, se generará la transacción y podrás coordinar la entrega física aquí.'}
              </Text>
              <TouchableOpacity
                style={styles.emptyCtaBtn}
                activeOpacity={0.85}
                onPress={() => {
                  if (activeTab === 'compras') {
                    router.push('/home' as any);
                  } else {
                    router.push('/upload' as any);
                  }
                }}
              >
                <Ionicons
                  name={activeTab === 'compras' ? 'compass-outline' : 'add-circle-outline'}
                  size={20}
                  color="#FFFFFF"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.emptyCtaBtnText}>
                  {activeTab === 'compras' ? 'Explorar catálogo de productos' : 'Publicar un producto'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredOrders.map((order) => {
              const isBuyerTab = activeTab === 'compras';
              const counterpartName = isBuyerTab
                ? order.seller?.full_name || 'Vendedor'
                : order.buyer?.full_name || 'Comprador';
              const counterpartId = isBuyerTab ? order.seller_id : order.buyer_id;

              const hasUserReviewed = isBuyerTab ? order.buyer_reviewed : order.seller_reviewed;
              const userRating = isBuyerTab ? order.buyer_rating : order.seller_rating;

              const isCompletedOrDelivered =
                order.status === 'COMPLETED' || order.status === 'DELIVERED';

              return (
                <View key={order.id} style={styles.orderCard}>
                  {/* Fila superior: Fecha y Estado */}
                  <View style={styles.orderCardHeader}>
                    <Text style={styles.orderDateText}>
                      {formatDate(order.created_at)} • Orden #{order.id.slice(0, 8)}
                    </Text>
                    {renderStatusBadge(order.status)}
                  </View>

                  {/* Fila central: Imagen del producto y detalles */}
                  <TouchableOpacity
                    style={styles.productRow}
                    activeOpacity={0.75}
                    onPress={() => handleGoToOrder(order)}
                  >
                    {order.product?.images?.[0] ? (
                      <Image
                        source={{ uri: order.product.images[0] }}
                        style={styles.productThumbnail}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.productPlaceholder}>
                        <Ionicons name="cube-outline" size={28} color="#9CA3AF" />
                      </View>
                    )}

                    <View style={styles.productInfoCol}>
                      <Text style={styles.productTitle} numberOfLines={2}>
                        {order.product?.title || 'Producto en Soltapp'}
                      </Text>
                      <Text style={styles.productPrice}>
                        {order.product?.price || '$ 0'}
                      </Text>

                      {/* Contraparte */}
                      <TouchableOpacity
                        style={styles.counterpartRow}
                        activeOpacity={0.7}
                        onPress={() => handleGoToProfile(counterpartId, counterpartName)}
                      >
                        <Ionicons
                          name={isBuyerTab ? 'storefront-outline' : 'person-outline'}
                          size={14}
                          color="#0D9488"
                          style={{ marginRight: 4 }}
                        />
                        <Text style={styles.counterpartRoleLabel}>
                          {isBuyerTab ? 'Vendido por: ' : 'Comprado por: '}
                        </Text>
                        <Text style={styles.counterpartNameLink} numberOfLines={1}>
                          {counterpartName}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>

                  {/* Fila de Valoración (si ya calificó) */}
                  {hasUserReviewed && (
                    <View style={styles.reviewedNoticeBox}>
                      <Ionicons name="star" size={15} color="#FBBF24" style={{ marginRight: 6 }} />
                      <Text style={styles.reviewedNoticeText}>
                        Calificaste a {counterpartName} con {userRating || 5} estrellas ✓
                      </Text>
                    </View>
                  )}

                  {/* Botones de acción */}
                  <View style={styles.cardActionsRow}>
                    {/* Botón principal: Ver encuentro */}
                    <TouchableOpacity
                      style={styles.detailBtn}
                      activeOpacity={0.8}
                      onPress={() => handleGoToOrder(order)}
                    >
                      <Ionicons
                        name={
                          order.status === 'PENDING_MEETUP'
                            ? (isBuyerTab ? 'scan-outline' : 'qr-code-outline')
                            : 'eye-outline'
                        }
                        size={16}
                        color={PRIMARY_TEAL}
                        style={{ marginRight: 6 }}
                      />
                      <Text style={styles.detailBtnText}>
                        {order.status === 'PENDING_MEETUP'
                          ? (isBuyerTab ? 'Escanear QR' : 'Mostrar QR')
                          : 'Ver detalles'}
                      </Text>
                    </TouchableOpacity>

                    {/* Botón de Calificar (si está entregado/completado y aún no calificó) */}
                    {isCompletedOrDelivered && !hasUserReviewed && (
                      <TouchableOpacity
                        style={styles.reviewBtn}
                        activeOpacity={0.85}
                        onPress={() => handleOpenReview(order)}
                      >
                        <Ionicons name="star" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                        <Text style={styles.reviewBtnText}>
                          {isBuyerTab ? 'Calificar Vendedor' : 'Calificar Comprador'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Modal de Calificación */}
      {selectedOrderForReview && (
        <MeetupReviewModal
          visible={showReviewModal}
          order={selectedOrderForReview}
          isSeller={activeTab === 'ventas'}
          onClose={() => {
            setShowReviewModal(false);
            setSelectedOrderForReview(null);
          }}
          onSuccess={() => {
            setShowReviewModal(false);
            setSelectedOrderForReview(null);
            loadData();
          }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 6,
    marginRight: 6,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: TEXT_DARK,
  },
  headerSubtitle: {
    fontSize: 12,
    color: MUTED_GRAY,
    marginTop: 2,
  },
  helpButton: {
    padding: 6,
  },
  segmentedContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
    backgroundColor: '#FFFFFF',
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 4,
  },
  segmentBtnActive: {
    backgroundColor: '#CCFBF1',
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: MUTED_GRAY,
  },
  segmentTextActive: {
    color: '#0D9488',
    fontWeight: '700',
  },
  countBadge: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 6,
  },
  countBadgeActive: {
    backgroundColor: '#0D9488',
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: MUTED_GRAY,
  },
  countBadgeTextActive: {
    color: '#FFFFFF',
  },
  chipsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: '#1F232E',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: MUTED_GRAY,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: MUTED_GRAY,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
    backgroundColor: BG_COLOR,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: TEXT_DARK,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: MUTED_GRAY,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 24,
  },
  emptyCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PRIMARY_TEAL,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    shadowColor: PRIMARY_TEAL,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyCtaBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  orderCard: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  orderDateText: {
    fontSize: 11,
    fontWeight: '600',
    color: MUTED_GRAY,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgePending: {
    backgroundColor: '#FEF3C7',
  },
  badgeDelivered: {
    backgroundColor: '#CCFBF1',
  },
  badgeCompleted: {
    backgroundColor: '#D1FAE5',
  },
  badgeCancelled: {
    backgroundColor: '#FEE2E2',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productThumbnail: {
    width: 68,
    height: 68,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
  },
  productPlaceholder: {
    width: 68,
    height: 68,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productInfoCol: {
    flex: 1,
    marginLeft: 14,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_DARK,
    lineHeight: 18,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0D9488',
    marginTop: 4,
  },
  counterpartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  counterpartRoleLabel: {
    fontSize: 12,
    color: MUTED_GRAY,
  },
  counterpartNameLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0D9488',
    flexShrink: 1,
  },
  reviewedNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  reviewedNoticeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  detailBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: PRIMARY_TEAL,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
  },
  detailBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0D9488',
  },
  reviewBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#0D9488',
  },
  reviewBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
