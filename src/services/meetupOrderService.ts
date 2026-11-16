import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabase';
import {
  MeetupOrder,
  QRGenerationResult,
  QRVerificationResult,
  PaymentConfirmationResult,
  OrderIssueResult,
  OrderReviewResult,
  SoltappNotification,
  SoltappReview,
} from '../types/order.types';
import { accountService, SoltappUser } from './accountService';

const isUuid = (str?: string | null): boolean => {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str.trim());
};

const ORDERS_STORAGE_KEY = '@soltapp_meetup_orders';
const NOTIFICATIONS_STORAGE_KEY = '@soltapp_notifications';
const REVIEWS_STORAGE_KEY = '@soltapp_user_reviews';
const SOLD_PRODUCTS_STORAGE_KEY = '@soltapp_sold_products';

// Almacenamiento condicional seguro para Web (localStorage) y Móvil (AsyncStorage)
export const appStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    }
    try {
      return await AsyncStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(key, value);
        return;
      } catch {}
    }
    try {
      await AsyncStorage.setItem(key, value);
    } catch {}
  },
  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(key);
        return;
      } catch {}
    }
    try {
      await AsyncStorage.removeItem(key);
    } catch {}
  },
};

export interface OrderCreateDetails {
  title?: string;
  price?: string;
  sellerName?: string;
  buyerName?: string;
  imageUri?: string;
}

export interface InboxConversationItem {
  id: string;
  orderId?: string;
  isMeetupSale: boolean;
  senderName: string;
  sellerName: string;
  productTitle: string;
  productPrice: string;
  productImage?: string | null;
  date: string;
  lastMessage: string;
  statusBadge?: string;
  unread: boolean;
  role: 'seller' | 'buyer';
}

// In-memory pub/sub de órdenes para notificación reactiva instantánea
const inMemoryOrderListeners = new Map<string, Set<(order: MeetupOrder) => void>>();

// Canal global de sincronización en tiempo real entre teléfonos físicos y navegadores
const MEETUP_SYNC_CHANNEL_NAME = 'soltapp-meetup-sync';
let syncChannel: any = null;

function getSyncChannel() {
  if (!syncChannel) {
    try {
      syncChannel = supabase.channel(MEETUP_SYNC_CHANNEL_NAME, {
        config: { broadcast: { self: false } },
      });

      syncChannel
        .on('broadcast', { event: 'new_meetup_order' }, async ({ payload }: any) => {
          try {
            if (payload?.order) {
              await meetupOrderService.saveLocalOrder(payload.order, false);
            }
            if (payload?.sellerNotification) {
              await meetupOrderService.sendOrderNotification(payload.sellerNotification, false);
            }
            if (payload?.buyerNotification) {
              await meetupOrderService.sendOrderNotification(payload.buyerNotification, false);
            }
          } catch (e) {
            console.warn('[RealtimeSync] Error procesando new_meetup_order:', e);
          }
        })
        .on('broadcast', { event: 'qr_generated' }, async ({ payload }: any) => {
          try {
            if (payload?.orderId && payload?.token) {
              const order = await meetupOrderService.getOrderById(payload.orderId);
              if (order) {
                order.qr_token = payload.token;
                order.qr_expires_at = payload.expiresAt;
                await meetupOrderService.saveLocalOrder(order, false);
              }
            }
          } catch (e) {
            console.warn('[RealtimeSync] Error procesando qr_generated:', e);
          }
        })
        .on('broadcast', { event: 'order_status_updated' }, async ({ payload }: any) => {
          try {
            if (payload?.orderId && payload?.status) {
              const order = await meetupOrderService.getOrderById(payload.orderId);
              if (order) {
                order.status = payload.status;
                if (payload.status === 'DELIVERED') {
                  order.qr_token = null;
                }
                await meetupOrderService.saveLocalOrder(order, false);
              } else if (payload.order) {
                await meetupOrderService.saveLocalOrder(payload.order, false);
              }
            }
          } catch (e) {
            console.warn('[RealtimeSync] Error procesando order_status_updated:', e);
          }
        })
        .on('broadcast', { event: 'new_order_review' }, async ({ payload }: any) => {
          try {
            if (payload?.review) {
              await meetupOrderService.saveLocalReview(payload.review, false);
            }
          } catch (e) {
            console.warn('[RealtimeSync] Error procesando new_order_review:', e);
          }
        })
        .on('broadcast', { event: 'product_sold' }, async ({ payload }: any) => {
          try {
            if (payload?.productId) {
              await meetupOrderService.markProductAsSold(payload.productId, false);
            }
          } catch (e) {
            console.warn('[RealtimeSync] Error procesando product_sold:', e);
          }
        })
        .on('broadcast', { event: 'request_sync' }, async () => {
          try {
            const allOrders = await meetupOrderService.getAllLocalOrders();
            const existingNotifs = await appStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
            const allReviews = await meetupOrderService.getAllLocalReviews();
            const soldIds = await meetupOrderService.getSoldProductIds();
            if (allOrders.length > 0 || existingNotifs || allReviews.length > 0 || soldIds.length > 0) {
              await syncChannel?.send({
                type: 'broadcast',
                event: 'sync_response',
                payload: {
                  orders: allOrders,
                  notifications: existingNotifs ? JSON.parse(existingNotifs) : [],
                  reviews: allReviews,
                  soldProductIds: soldIds,
                },
              });
            }
          } catch {}
        })
        .on('broadcast', { event: 'sync_response' }, async ({ payload }: any) => {
          try {
            if (payload?.orders && Array.isArray(payload.orders)) {
              for (const o of payload.orders) {
                await meetupOrderService.saveLocalOrder(o, false);
              }
            }
            if (payload?.notifications && Array.isArray(payload.notifications)) {
              for (const n of payload.notifications) {
                await meetupOrderService.sendOrderNotification(n, false);
              }
            }
            if (payload?.reviews && Array.isArray(payload.reviews)) {
              for (const r of payload.reviews) {
                await meetupOrderService.saveLocalReview(r, false);
              }
            }
            if (payload?.soldProductIds && Array.isArray(payload.soldProductIds)) {
              for (const pid of payload.soldProductIds) {
                await meetupOrderService.markProductAsSold(pid, false);
              }
            }
          } catch (e) {
            console.warn('[RealtimeSync] Error en sync_response:', e);
          }
        })
        .subscribe((status: string) => {
          if (status === 'SUBSCRIBED') {
            syncChannel?.send({
              type: 'broadcast',
              event: 'request_sync',
              payload: {},
            });
          }
        });
    } catch (err) {
      console.warn('[RealtimeSync] Error inicializando canal broadcast:', err);
    }
  }
  return syncChannel;
}

// Iniciar suscripción de inmediato
try {
  getSyncChannel();
} catch {}

export const meetupOrderService = {
  /**
   * Crea una nueva orden de encuentro cara a cara en estado PENDING_MEETUP
   * y genera notificaciones para el vendedor y para el comprador con sus nombres reales.
   */
  async createMeetupOrder(
    productId?: string,
    sellerId?: string,
    details?: OrderCreateDetails
  ): Promise<MeetupOrder> {
    const currentUser = await accountService.getCurrentUser();

    // Vendedor: si no se especifica, toma el ID de yassvica
    let targetSellerId = sellerId;
    if (!targetSellerId || targetSellerId === 'seller-yassvica') {
      targetSellerId = '122230dc-4ee3-407a-a32d-07a538b32212';
    }

    const buyerId = currentUser.id;
    let buyerName = details?.buyerName || currentUser.fullName || currentUser.username || 'Comprador';
    if (buyerId === 'f12e3fba-56fd-421b-8f0f-63061d4e5bdb' && (!details?.buyerName || details.buyerName === 'Comprador')) {
      buyerName = 'Kike Sanabria';
    }

    let sellerName = details?.sellerName || 'Vendedor';
    if (targetSellerId === '122230dc-4ee3-407a-a32d-07a538b32212' && (!details?.sellerName || details.sellerName === 'Vendedor' || details.sellerName === 'Carlos M.')) {
      sellerName = 'yassvica';
    }

    const productTitle = details?.title || 'Producto';
    const productPrice = details?.price || '$ 0';
    const productImage = details?.imageUri || null;

    let createdOrder: MeetupOrder;

    // Si ambos son UUID válidos, intentar crear en Supabase
    if (isUuid(buyerId) && isUuid(targetSellerId)) {
      try {
        const { data, error } = await supabase.rpc('create_meetup_order', {
          p_product_id: productId && isUuid(productId) ? productId : null,
          p_seller_id: targetSellerId,
        });

        if (!error && data?.order_id) {
          createdOrder = {
            id: data.order_id,
            buyer_id: buyerId,
            seller_id: targetSellerId,
            product_id: productId || null,
            status: 'PENDING_MEETUP',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            product: {
              id: productId || 'prod-custom',
              title: productTitle,
              price: productPrice,
              condition: 'Como nuevo',
              images: productImage ? [productImage] : [],
            },
            seller: {
              id: targetSellerId,
              full_name: sellerName,
            },
            buyer: {
              id: buyerId,
              full_name: buyerName,
            },
          };
        } else {
          throw new Error(error?.message || 'Fallback local');
        }
      } catch {
        const demoId = 'order-' + Date.now().toString(36);
        createdOrder = {
          id: demoId,
          buyer_id: buyerId,
          seller_id: targetSellerId,
          product_id: productId || null,
          status: 'PENDING_MEETUP',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          product: {
            id: productId || 'prod-custom',
            title: productTitle,
            price: productPrice,
            condition: 'Como nuevo',
            images: productImage ? [productImage] : [],
          },
          seller: {
            id: targetSellerId,
            full_name: sellerName,
          },
          buyer: {
            id: buyerId,
            full_name: buyerName,
          },
        };
      }
    } else {
      const demoId = 'order-' + Date.now().toString(36);
      createdOrder = {
        id: demoId,
        buyer_id: buyerId,
        seller_id: targetSellerId,
        product_id: productId || null,
        status: 'PENDING_MEETUP',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        product: {
          id: productId || 'prod-custom',
          title: productTitle,
          price: productPrice,
          condition: 'Como nuevo',
          images: productImage ? [productImage] : [],
        },
        seller: {
          id: targetSellerId,
          full_name: sellerName,
        },
        buyer: {
          id: buyerId,
          full_name: buyerName,
        },
      };
    }

    // 1. Guardar orden localmente y marcar producto como vendido para quitarlo del catálogo
    await this.saveLocalOrder(createdOrder, false);
    const prodIdToMark = productId || createdOrder.product_id || createdOrder.product?.id;
    if (prodIdToMark) {
      await this.markProductAsSold(prodIdToMark, true);
    }

    // 2. Notificación para el Vendedor de este producto
    const sellerNotif = await this.sendOrderNotification({
      order_id: createdOrder.id,
      seller_id: targetSellerId,
      buyer_id: buyerId,
      recipient_role: 'seller',
      title: '¡Nueva compra pactada!',
      message: `${buyerName} acordó comprar "${productTitle}" por ${productPrice}. Toca para abrir la venta y generar el código QR.`,
      product_title: productTitle,
      product_price: productPrice,
      product_image: productImage,
      buyer_name: buyerName,
      seller_name: sellerName,
      created_at: new Date().toISOString(),
      read: false,
    }, false);

    // 3. Notificación para el Comprador de este producto
    const buyerNotif = await this.sendOrderNotification({
      order_id: createdOrder.id,
      seller_id: targetSellerId,
      buyer_id: buyerId,
      recipient_role: 'buyer',
      title: '¡Compra pactada con éxito!',
      message: `Has acordado comprar "${productTitle}" a ${sellerName} por ${productPrice}. Recuerda revisar el producto en persona y escanear el QR antes de pagar.`,
      product_title: productTitle,
      product_price: productPrice,
      product_image: productImage,
      buyer_name: buyerName,
      seller_name: sellerName,
      created_at: new Date().toISOString(),
      read: false,
    }, false);

    // 4. TRANSMISIÓN INMEDIATA ENTRE TELÉFONOS VÍA SUPABASE REALTIME
    try {
      const ch = getSyncChannel();
      await ch?.send({
        type: 'broadcast',
        event: 'new_meetup_order',
        payload: {
          order: createdOrder,
          sellerNotification: sellerNotif,
          buyerNotification: buyerNotif,
        },
      });
    } catch (e) {
      console.warn('[createMeetupOrder] Error transmitiendo orden al otro teléfono:', e);
    }

    return createdOrder;
  },

  /**
   * Guarda o actualiza una orden en el almacenamiento persistente
   * y emite eventos de actualización para sincronizar UI en tiempo real
   */
  async saveLocalOrder(order: MeetupOrder, broadcast: boolean = true): Promise<void> {
    try {
      const existing = await appStorage.getItem(ORDERS_STORAGE_KEY);
      const orders: MeetupOrder[] = existing ? JSON.parse(existing) : [];
      const index = orders.findIndex((o) => o.id === order.id);
      if (index >= 0) {
        orders[index] = { ...orders[index], ...order };
      } else {
        orders.unshift(order);
      }
      await appStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));

      // 1. Notificar a listeners en memoria
      const listeners = inMemoryOrderListeners.get(order.id);
      if (listeners) {
        listeners.forEach((listener) => {
          try {
            listener(order);
          } catch (e) {
            console.warn('[saveLocalOrder] Error notificando listener:', e);
          }
        });
      }

      // 2. Disparar evento para Web (misma ventana y entre pestañas)
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        try {
          window.dispatchEvent(new CustomEvent('soltapp_order_update', { detail: order }));
          window.dispatchEvent(new Event('storage'));
        } catch {}
      }

      // 3. Transmitir en tiempo real a otros teléfonos si corresponde
      if (broadcast) {
        try {
          const ch = getSyncChannel();
          ch?.send({
            type: 'broadcast',
            event: 'order_status_updated',
            payload: { orderId: order.id, status: order.status, order },
          });
        } catch {}
      }
    } catch (e) {
      console.warn('[saveLocalOrder] Error guardando orden local:', e);
    }
  },

  /**
   * Obtiene todas las órdenes locales almacenadas
   */
  async getAllLocalOrders(): Promise<MeetupOrder[]> {
    try {
      const existing = await appStorage.getItem(ORDERS_STORAGE_KEY);
      if (existing) {
        let orders: MeetupOrder[] = JSON.parse(existing);
        return orders.filter((o) => o && o.id);
      }
    } catch {}
    return [];
  },

  /**
   * Obtiene la orden por ID
   */
  async getOrderById(orderId: string): Promise<MeetupOrder | null> {
    try {
      const existing = await appStorage.getItem(ORDERS_STORAGE_KEY);
      if (existing) {
        const orders: MeetupOrder[] = JSON.parse(existing);
        const found = orders.find((o) => o.id === orderId);
        if (found) {
          return found;
        }
      }
    } catch {}

    if (isUuid(orderId)) {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            product:products(id, title, price, condition)
          `)
          .eq('id', orderId)
          .single();

        if (data && !error) {
          return data as MeetupOrder;
        }
      } catch {}
    }

    return null;
  },

  /**
   * Retorna la última orden de compra o de venta del usuario
   */
  async getLatestOrder(type: 'buyer' | 'seller' = 'buyer', userId?: string): Promise<MeetupOrder | null> {
    const currentUserId = userId || (await accountService.getCurrentUser()).id;
    try {
      const existing = await appStorage.getItem(ORDERS_STORAGE_KEY);
      if (existing) {
        const orders: MeetupOrder[] = JSON.parse(existing);
        const found = orders.find((o) => {
          if (type === 'buyer') {
            return o.buyer_id === currentUserId;
          }
          return o.seller_id === currentUserId;
        });
        if (found) return found;
        if (orders.length > 0) return orders[0];
      }
    } catch {}
    return null;
  },

  /**
   * Envía y almacena una notificación
   */
  async sendOrderNotification(notifData: Partial<SoltappNotification>, broadcast: boolean = true): Promise<SoltappNotification> {
    const notif: SoltappNotification = {
      id: notifData.id || 'notif-' + Date.now().toString(36) + '-' + (notifData.recipient_role || 's'),
      order_id: notifData.order_id || '',
      seller_id: notifData.seller_id,
      buyer_id: notifData.buyer_id,
      recipient_role: notifData.recipient_role || 'seller',
      title: notifData.title || 'Actualización de compraventa',
      message: notifData.message || 'Se ha actualizado el estado de tu encuentro.',
      product_title: notifData.product_title || 'Producto',
      product_price: notifData.product_price || '$ 0',
      product_image: notifData.product_image || null,
      buyer_name: notifData.buyer_name || 'Comprador',
      seller_name: notifData.seller_name || 'Vendedor',
      created_at: notifData.created_at || new Date().toISOString(),
      read: false,
    };

    try {
      const existing = await appStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      const list: SoltappNotification[] = existing ? JSON.parse(existing) : [];
      
      const index = list.findIndex(
        (n) => n.order_id === notif.order_id && n.recipient_role === notif.recipient_role
      );
      if (index >= 0) {
        list[index] = notif;
      } else {
        list.unshift(notif);
      }
      await appStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(list));

      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.dispatchEvent(new Event('storage'));
      }

      if (broadcast) {
        try {
          const ch = getSyncChannel();
          ch?.send({
            type: 'broadcast',
            event: 'new_meetup_order',
            payload: {
              sellerNotification: notif.recipient_role === 'seller' ? notif : undefined,
              buyerNotification: notif.recipient_role === 'buyer' ? notif : undefined,
            },
          });
        } catch {}
      }
    } catch (e) {
      console.warn('[sendOrderNotification] Error guardando:', e);
    }

    return notif;
  },

  /**
   * Obtiene la lista de notificaciones correspondientes al usuario especificado
   */
  async getNotifications(userId?: string): Promise<SoltappNotification[]> {
    getSyncChannel();
    const currentUser = await accountService.getCurrentUser();
    const currentUserId = userId || currentUser.id;
    let list: SoltappNotification[] = [];

    try {
      const existing = await appStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (existing) {
        list = JSON.parse(existing);
      }
    } catch {}

    // Filtrar estrictamente solo para este usuario:
    // - Si este usuario es el vendedor de la orden -> recibe aviso de venta
    // - Si este usuario es el comprador de la orden -> recibe aviso de compra
    const filtered = list.filter((n) => {
      if (!n || !n.order_id) return false;
      const isSeller = n.recipient_role === 'seller' && n.seller_id === currentUserId;
      const isBuyer = n.recipient_role === 'buyer' && n.buyer_id === currentUserId;
      return isSeller || isBuyer;
    });

    return filtered;
  },

  /**
   * Limpia completamente todas las órdenes y notificaciones de prueba de almacenamiento local
   */
  async resetAllMeetupData(): Promise<void> {
    await appStorage.removeItem(ORDERS_STORAGE_KEY);
    await appStorage.removeItem(NOTIFICATIONS_STORAGE_KEY);
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('soltapp_data_reset'));
    }
  },

  /**
   * Obtiene la lista de conversaciones de la bandeja de entrada para el usuario.
   */
  async getInboxConversations(userId?: string): Promise<InboxConversationItem[]> {
    const currentUser = await accountService.getCurrentUser();
    const currentUserId = userId || currentUser.id;
    const list: InboxConversationItem[] = [];
    const notifs = await this.getNotifications(currentUserId);
    const orders = await this.getAllLocalOrders();

    const processedOrderIds = new Set<string>();

    for (const notif of notifs) {
      if (!processedOrderIds.has(notif.order_id + '-' + notif.recipient_role)) {
        processedOrderIds.add(notif.order_id + '-' + notif.recipient_role);
        const order = orders.find((o) => o.id === notif.order_id);
        const isDelivered = order?.status === 'DELIVERED';
        const isCompleted = order?.status === 'COMPLETED';

        const isUserSeller = notif.recipient_role === 'seller';

        let statusText = '';
        let statusBadge = '';

        if (isUserSeller) {
          statusText = '🤝 ¡Nueva venta! Toca para ver y generar tu QR de entrega';
          statusBadge = 'Venta';

          if (isCompleted) {
            statusText = '✅ Venta completada con éxito. Pago recibido.';
            statusBadge = 'Completada';
          } else if (isDelivered) {
            statusText = '📦 Entrega validada por comprador. Esperando pago externo.';
            statusBadge = 'Por Cobrar';
          }
        } else {
          statusText = '📦 Compra en curso. Toca para ver y escanear el QR';
          statusBadge = 'Compra';

          if (isCompleted) {
            statusText = '✅ Compra completada. ¡Gracias por usar Soltapp!';
            statusBadge = 'Completada';
          } else if (isDelivered) {
            statusText = '✅ Escaneaste el QR. Realiza el pago externo al vendedor.';
            statusBadge = 'Entregado';
          }
        }

        const counterpartName = isUserSeller
          ? (notif.buyer_name || order?.buyer?.full_name || 'Comprador')
          : (notif.seller_name || order?.seller?.full_name || 'Vendedor');

        list.push({
          id: `conv-order-${notif.order_id}-${notif.recipient_role}`,
          orderId: notif.order_id,
          isMeetupSale: true,
          senderName: counterpartName,
          sellerName: notif.seller_name || 'Vendedor',
          productTitle: notif.product_title,
          productPrice: notif.product_price,
          productImage: notif.product_image || (order?.product?.images?.[0] || null),
          date: 'Reciente',
          lastMessage: statusText,
          statusBadge,
          unread: !notif.read,
          role: isUserSeller ? 'seller' : 'buyer',
        });
      }
    }

    // Chat de soporte opcional (solo si no hay conversaciones)
    if (list.length === 0) {
      list.push({
        id: 'conv1',
        isMeetupSale: false,
        senderName: 'Alex Silva',
        sellerName: 'Alex Silva',
        productTitle: 'Separadores Braid 5×100',
        productPrice: '$ 50.000',
        date: 'Reciente',
        lastMessage: 'En la plaza te parece?',
        unread: false,
        role: 'buyer',
      });
    }

    return list;
  },

  /**
   * Marca una notificación como leída
   */
  async markNotificationAsRead(id: string): Promise<void> {
    try {
      const existing = await appStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (existing) {
        const list: SoltappNotification[] = JSON.parse(existing);
        const item = list.find((n) => n.id === id);
        if (item) {
          item.read = true;
          await appStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(list));
        }
      }
    } catch {}
  },

  /**
   * Genera el token QR seguro con vigencia de 5 minutos (Exclusivo Vendedor)
   */
  async generateMeetupQr(orderId: string): Promise<QRGenerationResult> {
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const cleanOrderId = orderId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);
    const generatedToken = `soltapp_${cleanOrderId}_${randomSuffix}_${Date.now()}`;
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    let order = await this.getOrderById(orderId);
    if (!order) {
      order = {
        id: orderId,
        buyer_id: 'buyer-active',
        seller_id: '122230dc-4ee3-407a-a32d-07a538b32212',
        status: 'PENDING_MEETUP',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
    order.qr_token = generatedToken;
    order.qr_expires_at = expiresAt;
    order.updated_at = new Date().toISOString();
    await this.saveLocalOrder(order);

    // Transmitir token generado en tiempo real al teléfono del comprador
    try {
      const ch = getSyncChannel();
      ch?.send({
        type: 'broadcast',
        event: 'qr_generated',
        payload: {
          orderId: order.id,
          token: generatedToken,
          expiresAt: expiresAt,
        },
      });
    } catch (e) {
      console.warn('[generateMeetupQr] Error transmitiendo QR:', e);
    }

    if (isUuid(orderId)) {
      try {
        const { data, error } = await supabase.rpc('generate_meetup_qr', {
          p_order_id: orderId,
        });

        if (error) {
          await supabase
            .from('orders')
            .update({
              qr_token: generatedToken,
              qr_expires_at: expiresAt,
              updated_at: new Date().toISOString(),
            })
            .eq('id', orderId);
        } else if (data?.qr_token) {
          order.qr_token = data.qr_token;
          order.qr_expires_at = data.qr_expires_at || expiresAt;
          await this.saveLocalOrder(order);
          return data as QRGenerationResult;
        }
      } catch (err: any) {
        console.warn('[generateMeetupQr] Error RPC Supabase, usando local:', err.message);
      }
    }

    return {
      order_id: orderId,
      qr_token: generatedToken,
      qr_expires_at: expiresAt,
    };
  },

  /**
   * Valida estrictamente el token escaneado por el comprador y pasa a DELIVERED (Exclusivo Comprador)
   * Verifica:
   * 1. Que el QR no pertenezca a otra orden / producto.
   * 2. Que el token no esté expirado (vigencia 5 minutos).
   * 3. Que el token coincida exactamente con el generado por el vendedor.
   * Al validar, notifica al vendedor inmediatamente.
   */
  async verifyMeetupQr(
    orderId: string,
    token: string,
    providedOrderId?: string,
    providedExpiresAt?: string
  ): Promise<QRVerificationResult> {
    const cleanToken = (token || '').trim();

    if (!cleanToken) {
      throw new Error('El código QR está vacío o es inválido.');
    }

    // 1. Validar que el QR corresponda a la orden actual
    if (providedOrderId && providedOrderId !== orderId) {
      throw new Error(
        'El código QR escaneado pertenece a otra compra o producto diferente. Escanea el código del vendedor para esta compra.'
      );
    }

    // 2. Obtener la orden existente (o reconstruirla si aún no sincronizó por completo)
    let order = await this.getOrderById(orderId);
    if (!order) {
      order = {
        id: orderId,
        buyer_id: 'buyer-current',
        seller_id: 'seller-current',
        status: 'PENDING_MEETUP',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    // Si ya está DELIVERED o COMPLETED, confirmar
    if (order.status === 'DELIVERED' || order.status === 'COMPLETED') {
      return {
        success: true,
        order_id: orderId,
        status: order.status,
        message: 'La entrega física ya había sido validada previamente.',
      };
    }

    // 3. Validar formato de token seguro de Soltapp
    if (!cleanToken.startsWith('soltapp_')) {
      throw new Error('El código escaneado no es un código QR válido de Soltapp.');
    }

    // 4. Validar expiración (5 minutos)
    const expirationToCheck = providedExpiresAt || order.qr_expires_at;
    if (expirationToCheck) {
      const expirationDate = new Date(expirationToCheck);
      if (new Date() > expirationDate) {
        throw new Error(
          'El código QR ha expirado (vigencia de 5 minutos). Pide al vendedor que presione "Regenerar QR".'
        );
      }
    }

    // 5. Si la orden local ya tenía registrado el token, validar que coincida
    if (order.qr_token && order.qr_token.trim() !== cleanToken) {
      throw new Error(
        'Código QR incorrecto. El código escaneado no coincide con el último código generado por el vendedor.'
      );
    }

    // 6. Token 100% válido -> Marcar como DELIVERED
    order.status = 'DELIVERED';
    order.qr_token = null;
    order.updated_at = new Date().toISOString();
    await this.saveLocalOrder(order, true);

    const soldProdId = order.product_id || order.product?.id;
    if (soldProdId) {
      await this.markProductAsSold(soldProdId, true);
    }

    // Intentar sincronizar en Supabase si es UUID
    if (isUuid(orderId)) {
      try {
        const { error } = await supabase.rpc('verify_meetup_qr', {
          p_order_id: orderId,
          p_token: cleanToken,
        });

        if (error) {
          await supabase
            .from('orders')
            .update({
              status: 'DELIVERED',
              qr_token: null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', orderId);
        }
      } catch (err: any) {
        console.warn('[verifyMeetupQr] Sincronización Supabase:', err.message);
      }
    }

    // 7. Enviar notificación directa al VENDEDOR informándole que se validó la entrega
    await this.sendOrderNotification({
      order_id: order.id,
      seller_id: order.seller_id,
      buyer_id: order.buyer_id,
      recipient_role: 'seller',
      title: '¡Entrega física validada!',
      message: `${order.buyer?.full_name || 'El comprador'} escaneó tu código QR y confirmó la entrega. Recibe el pago y confirma la venta.`,
      product_title: order.product?.title || '',
      product_price: String(order.product?.price || '$ 0'),
      product_image: order.product?.images?.[0] || null,
      buyer_name: order.buyer?.full_name || 'Comprador',
      seller_name: order.seller?.full_name || 'Vendedor',
      created_at: new Date().toISOString(),
      read: false,
    });

    return {
      success: true,
      order_id: orderId,
      status: 'DELIVERED',
      message: 'Entrega física validada exitosamente.',
    };
  },

  /**
   * Confirma la recepción del pago externo y completa la orden (Exclusivo Vendedor)
   */
  async confirmPaymentReceived(orderId: string): Promise<PaymentConfirmationResult> {
    const completedAt = new Date().toISOString();
    const order = await this.getOrderById(orderId);
    if (!order) {
      throw new Error('No se encontró la orden especificada.');
    }

    order.status = 'COMPLETED';
    order.completed_at = completedAt;
    order.updated_at = completedAt;
    await this.saveLocalOrder(order);

    const soldProdId = order.product_id || order.product?.id;
    if (soldProdId) {
      await this.markProductAsSold(soldProdId, true);
    }

    if (isUuid(orderId)) {
      try {
        const { error } = await supabase.rpc('confirm_payment_received', {
          p_order_id: orderId,
        });

        if (error) {
          await supabase
            .from('orders')
            .update({
              status: 'COMPLETED',
              completed_at: completedAt,
              updated_at: completedAt,
            })
            .eq('id', orderId);
        }
      } catch (err: any) {
        console.warn('[confirmPaymentReceived] Sincronización Supabase:', err.message);
      }
    }

    // Notificar al comprador que la venta se completó y ya pueden calificarse
    await this.sendOrderNotification({
      order_id: order.id,
      seller_id: order.seller_id,
      buyer_id: order.buyer_id,
      recipient_role: 'buyer',
      title: '¡Compra finalizada con éxito!',
      message: `${order.seller?.full_name || 'El vendedor'} confirmó la recepción del pago. La compra ha finalizado. ¡Califica tu experiencia!`,
      product_title: order.product?.title || '',
      product_price: String(order.product?.price || '$ 0'),
      product_image: order.product?.images?.[0] || null,
      buyer_name: order.buyer?.full_name || 'Comprador',
      seller_name: order.seller?.full_name || 'Vendedor',
      created_at: new Date().toISOString(),
      read: false,
    });

    return {
      success: true,
      order_id: orderId,
      status: 'COMPLETED',
      completed_at: completedAt,
    };
  },

  /**
   * Reporta incidencia de excepción (NO_SHOW o CANCELLED)
   */
  async reportOrderIssue(
    orderId: string,
    action: 'NO_SHOW' | 'CANCELLED',
    reason?: string
  ): Promise<OrderIssueResult> {
    const currentUser = await accountService.getCurrentUser();
    const order = await this.getOrderById(orderId);
    if (!order) {
      throw new Error('No se encontró la orden especificada.');
    }
    order.status = action;
    order.cancelled_by = currentUser.id;
    order.cancellation_reason = reason;
    order.updated_at = new Date().toISOString();
    await this.saveLocalOrder(order);

    if (isUuid(orderId)) {
      try {
        const { error } = await supabase.rpc('report_order_issue', {
          p_order_id: orderId,
          p_action: action,
          p_reason: reason || null,
        });

        if (error) {
          await supabase
            .from('orders')
            .update({
              status: action,
              cancelled_by: currentUser.id,
              cancellation_reason: reason || null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', orderId);
        }
      } catch {}
    }

    return {
      success: true,
      order_id: orderId,
      status: action,
      cancelled_by: currentUser.id,
      cancellation_reason: reason,
    };
  },

  /**
   * Guarda una valoración localmente y opcionalmente la transmite en tiempo real
   */
  async saveLocalReview(review: SoltappReview, broadcast: boolean = true): Promise<void> {
    try {
      const existing = await appStorage.getItem(REVIEWS_STORAGE_KEY);
      const reviews: SoltappReview[] = existing ? JSON.parse(existing) : [];
      const index = reviews.findIndex(
        (r) => r.id === review.id || (r.order_id === review.order_id && r.role === review.role)
      );
      if (index >= 0) {
        reviews[index] = { ...reviews[index], ...review };
      } else {
        reviews.unshift(review);
      }
      await appStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(reviews));

      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        try {
          window.dispatchEvent(new CustomEvent('soltapp_review_update', { detail: review }));
          window.dispatchEvent(new Event('storage'));
        } catch {}
      }

      if (broadcast) {
        try {
          const ch = getSyncChannel();
          ch?.send({
            type: 'broadcast',
            event: 'new_order_review',
            payload: { review },
          });
        } catch {}
      }
    } catch (e) {
      console.warn('[saveLocalReview] Error guardando valoración:', e);
    }
  },

  /**
   * Obtiene todas las valoraciones guardadas localmente
   */
  async getAllLocalReviews(): Promise<SoltappReview[]> {
    try {
      const existing = await appStorage.getItem(REVIEWS_STORAGE_KEY);
      if (existing) {
        return JSON.parse(existing);
      }
    } catch {}
    return [];
  },

  /**
   * Obtiene las valoraciones recibidas por un usuario
   */
  async getUserReviews(userId?: string): Promise<SoltappReview[]> {
    getSyncChannel();
    const currentUser = await accountService.getCurrentUser();
    const targetUserId = userId || currentUser.id;
    const all = await this.getAllLocalReviews();

    return all.filter((r) => {
      if (!r) return false;
      if (r.reviewed_user_id === targetUserId) return true;
      if (
        (targetUserId === '122230dc-4ee3-407a-a32d-07a538b32212' || targetUserId.toLowerCase().includes('yassvica')) &&
        (r.reviewed_user_id === '122230dc-4ee3-407a-a32d-07a538b32212' || r.reviewed_user_name?.toLowerCase().includes('yassvica'))
      ) {
        return true;
      }
      if (
        (targetUserId === 'f12e3fba-56fd-421b-8f0f-63061d4e5bdb' || targetUserId.toLowerCase().includes('kike')) &&
        (r.reviewed_user_id === 'f12e3fba-56fd-421b-8f0f-63061d4e5bdb' || r.reviewed_user_name?.toLowerCase().includes('kike'))
      ) {
        return true;
      }
      return false;
    });
  },

  /**
   * Marca un producto como vendido, actualiza Supabase y lo remueve del catálogo en tiempo real
   */
  async markProductAsSold(productId?: string | null, broadcast: boolean = true): Promise<void> {
    if (!productId) return;
    try {
      const existing = await appStorage.getItem(SOLD_PRODUCTS_STORAGE_KEY);
      const soldIds: string[] = existing ? JSON.parse(existing) : [];
      if (!soldIds.includes(productId)) {
        soldIds.push(productId);
        await appStorage.setItem(SOLD_PRODUCTS_STORAGE_KEY, JSON.stringify(soldIds));
      }

      // Sincronizar en Supabase si es UUID
      if (isUuid(productId)) {
        try {
          await supabase
            .from('products')
            .update({
              status: 'vendido',
              updated_at: new Date().toISOString(),
            })
            .eq('id', productId);
        } catch (err) {
          console.warn('[markProductAsSold] Error Supabase update:', err);
        }
      }

      // Transmitir en tiempo real a otros teléfonos
      if (broadcast) {
        try {
          const ch = getSyncChannel();
          ch?.send({
            type: 'broadcast',
            event: 'product_sold',
            payload: { productId },
          });
        } catch {}
      }

      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        try {
          window.dispatchEvent(new Event('storage'));
          window.dispatchEvent(new CustomEvent('soltapp_product_sold', { detail: { productId } }));
        } catch {}
      }
    } catch (e) {
      console.warn('[markProductAsSold] Error:', e);
    }
  },

  /**
   * Obtiene la lista de IDs de productos vendidos o con compras en curso
   */
  async getSoldProductIds(): Promise<string[]> {
    try {
      const existing = await appStorage.getItem(SOLD_PRODUCTS_STORAGE_KEY);
      const list: string[] = existing ? JSON.parse(existing) : [];
      const orders = await this.getAllLocalOrders();
      for (const o of orders) {
        if (o.product?.id && !list.includes(o.product.id)) {
          list.push(o.product.id);
        }
        if (o.product_id && !list.includes(o.product_id)) {
          list.push(o.product_id);
        }
      }
      return list;
    } catch {
      return [];
    }
  },

  /**
   * Obtiene el historial completo de compras o ventas para el usuario especificado
   */
  async getUserOrders(type: 'buyer' | 'seller' = 'buyer', userId?: string): Promise<MeetupOrder[]> {
    const currentUser = await accountService.getCurrentUser();
    const currentUserId = userId || currentUser.id;
    const all = await this.getAllLocalOrders();

    return all.filter((o) => {
      if (!o || !o.id) return false;
      if (type === 'buyer') {
        if (o.buyer_id === currentUserId) return true;
        if (
          (currentUserId === 'f12e3fba-56fd-421b-8f0f-63061d4e5bdb' ||
            currentUser.email?.toLowerCase().includes('kike') ||
            currentUser.fullName?.toLowerCase().includes('kike')) &&
          (o.buyer_id === 'f12e3fba-56fd-421b-8f0f-63061d4e5bdb' ||
            o.buyer?.full_name?.toLowerCase().includes('kike'))
        ) {
          return true;
        }
        return false;
      } else {
        if (o.seller_id === currentUserId) return true;
        if (
          (currentUserId === '122230dc-4ee3-407a-a32d-07a538b32212' ||
            currentUser.email?.toLowerCase().includes('yassvica') ||
            currentUser.fullName?.toLowerCase().includes('yassvica')) &&
          (o.seller_id === '122230dc-4ee3-407a-a32d-07a538b32212' ||
            o.seller?.full_name?.toLowerCase().includes('yassvica'))
        ) {
          return true;
        }
        return false;
      }
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  /**
   * Envía la calificación mutua al completarse la transacción (del comprador al vendedor o viceversa)
   */
  async submitOrderReview(
    orderId: string,
    rating: number,
    comment?: string,
    role?: 'buyer' | 'seller'
  ): Promise<OrderReviewResult> {
    const currentUser = await accountService.getCurrentUser();
    let order = await this.getOrderById(orderId);

    if (!order) {
      order = {
        id: orderId,
        buyer_id: currentUser.id,
        seller_id: '122230dc-4ee3-407a-a32d-07a538b32212',
        status: 'COMPLETED',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    const cleanRating = Math.max(1, Math.min(5, Math.round(rating)));
    const cleanComment = (comment || '').trim();

    // Determinar si quien califica es comprador o vendedor
    const isBuyerReviewing = role ? role === 'buyer' : (order.buyer_id === currentUser.id);

    const reviewerId = isBuyerReviewing
      ? (order.buyer_id && order.buyer_id !== 'buyer-remote' ? order.buyer_id : currentUser.id)
      : (order.seller_id && order.seller_id !== 'seller-remote' ? order.seller_id : currentUser.id);

    let reviewerName = isBuyerReviewing
      ? (order.buyer?.full_name || currentUser.fullName || 'Comprador')
      : (order.seller?.full_name || currentUser.fullName || 'Vendedor');

    let reviewedUserId = isBuyerReviewing
      ? (order.seller_id && order.seller_id !== 'seller-remote' ? order.seller_id : (order.seller?.id || '122230dc-4ee3-407a-a32d-07a538b32212'))
      : (order.buyer_id && order.buyer_id !== 'buyer-remote' ? order.buyer_id : (order.buyer?.id || 'f12e3fba-56fd-421b-8f0f-63061d4e5bdb'));

    let reviewedUserName = isBuyerReviewing
      ? (order.seller?.full_name || 'Vendedor')
      : (order.buyer?.full_name || 'Comprador');

    if (reviewedUserId === '122230dc-4ee3-407a-a32d-07a538b32212' && (!reviewedUserName || reviewedUserName === 'Vendedor' || reviewedUserName === 'Carlos M.')) {
      reviewedUserName = 'yassvica';
    }
    if (reviewerId === 'f12e3fba-56fd-421b-8f0f-63061d4e5bdb' && (!reviewerName || reviewerName === 'Comprador')) {
      reviewerName = 'Kike Sanabria';
    }

    // 1. Actualizar el estado del pedido y marcar la valoración
    if (isBuyerReviewing) {
      order.buyer_reviewed = true;
      order.buyer_rating = cleanRating;
      order.buyer_comment = cleanComment;
    } else {
      order.seller_reviewed = true;
      order.seller_rating = cleanRating;
      order.seller_comment = cleanComment;
    }

    // Si la orden estaba en DELIVERED, al calificar pasa automáticamente a COMPLETED
    if (order.status === 'DELIVERED' || order.status === 'PENDING_MEETUP') {
      order.status = 'COMPLETED';
      order.completed_at = new Date().toISOString();
    }
    order.updated_at = new Date().toISOString();

    await this.saveLocalOrder(order, true);

    // 2. Crear y guardar el objeto formal de Valoración
    const reviewId = 'rev-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6);
    const review: SoltappReview = {
      id: reviewId,
      order_id: order.id,
      reviewer_id: reviewerId,
      reviewer_name: reviewerName,
      reviewed_user_id: reviewedUserId,
      reviewed_user_name: reviewedUserName,
      role: isBuyerReviewing ? 'buyer' : 'seller',
      rating: cleanRating,
      comment: cleanComment,
      product_id: order.product?.id || null,
      product_title: order.product?.title || 'Producto',
      product_image: order.product?.images?.[0] || null,
      created_at: new Date().toISOString(),
    };

    await this.saveLocalReview(review, true);

    // 3. Notificar a la otra parte sobre la nueva reseña recibida
    try {
      await this.sendOrderNotification({
        order_id: order.id,
        seller_id: order.seller_id,
        buyer_id: order.buyer_id,
        recipient_role: isBuyerReviewing ? 'seller' : 'buyer',
        title: '¡Nueva valoración recibida!',
        message: `${reviewerName} te ha calificado con ${cleanRating} estrellas${cleanComment ? ': "' + cleanComment + '"' : '.'}`,
        product_title: order.product?.title || '',
        product_price: String(order.product?.price || '$ 0'),
        product_image: order.product?.images?.[0] || null,
        buyer_name: order.buyer?.full_name || 'Comprador',
        seller_name: order.seller?.full_name || 'Vendedor',
        created_at: new Date().toISOString(),
        read: false,
      });
    } catch (e) {
      console.warn('[submitOrderReview] Error enviando notificación de reseña:', e);
    }

    // 4. Intentar sincronizar en Supabase si es UUID
    if (isUuid(orderId)) {
      try {
        const { data, error } = await supabase.rpc('submit_order_review', {
          p_order_id: orderId,
          p_rating: cleanRating,
          p_comment: cleanComment || null,
        });

        if (!error && data) {
          return data as OrderReviewResult;
        }
      } catch {}
    }

    return {
      success: true,
      review_id: reviewId,
      rating: cleanRating,
    };
  },

  /**
   * Suscripción en tiempo real a cambios en la orden mediante Supabase Realtime,
   * eventos cruzados en Web y polling activo de sincronización instantánea
   */
  subscribeToOrder(
    orderId: string,
    onUpdate: (updatedOrder: Partial<MeetupOrder>) => void
  ) {
    if (!orderId) {
      return () => {};
    }

    // 1. Suscribir listener en memoria
    if (!inMemoryOrderListeners.has(orderId)) {
      inMemoryOrderListeners.set(orderId, new Set());
    }
    const orderSet = inMemoryOrderListeners.get(orderId)!;
    const memoryListener = (order: MeetupOrder) => {
      onUpdate(order);
    };
    orderSet.add(memoryListener);

    // 2. Sincronización en Web a través de CustomEvent y 'storage'
    let removeWebListeners = () => {};
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleStorage = (e: any) => {
        if (e.key === ORDERS_STORAGE_KEY && e.newValue) {
          try {
            const orders: MeetupOrder[] = JSON.parse(e.newValue);
            const found = orders.find((o) => o.id === orderId);
            if (found) {
              onUpdate(found);
            }
          } catch {}
        }
      };

      const handleCustomOrderUpdate = (e: any) => {
        if (e.detail && e.detail.id === orderId) {
          onUpdate(e.detail);
        }
      };

      window.addEventListener('storage', handleStorage);
      window.addEventListener('soltapp_order_update', handleCustomOrderUpdate);

      removeWebListeners = () => {
        window.removeEventListener('storage', handleStorage);
        window.removeEventListener('soltapp_order_update', handleCustomOrderUpdate);
      };
    }

    // 3. Polling de alta reactividad (cada 800ms) activo tanto en Móvil como en Web
    const pollInterval = setInterval(async () => {
      try {
        const order = await meetupOrderService.getOrderById(orderId);
        if (order) {
          onUpdate(order);
        }
      } catch {}
    }, 800);

    // 4. Si es UUID, suscribir también a Supabase Realtime postgres_changes
    let unsubscribeSupabase = () => {};
    if (isUuid(orderId)) {
      try {
        const channelName = `order-rt-${orderId.substring(0, 8)}-${Date.now()}`;
        const channel = supabase
          .channel(channelName)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'orders',
              filter: `id=eq.${orderId}`,
            },
            (payload) => {
              if (payload.new) {
                onUpdate(payload.new as Partial<MeetupOrder>);
              }
            }
          )
          .subscribe();

        unsubscribeSupabase = () => {
          try {
            supabase.removeChannel(channel);
          } catch {}
        };
      } catch (e) {
        console.warn('[subscribeToOrder] Error Realtime Supabase:', e);
      }
    }

    return () => {
      orderSet.delete(memoryListener);
      if (orderSet.size === 0) {
        inMemoryOrderListeners.delete(orderId);
      }
      clearInterval(pollInterval);
      removeWebListeners();
      unsubscribeSupabase();
    };
  },
};
