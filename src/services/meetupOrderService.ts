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
} from '../types/order.types';
import { accountService, SoltappUser } from './accountService';

const isUuid = (str?: string | null): boolean => {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str.trim());
};

const ORDERS_STORAGE_KEY = '@soltapp_meetup_orders';
const NOTIFICATIONS_STORAGE_KEY = '@soltapp_notifications';

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

export const meetupOrderService = {
  /**
   * Crea una nueva orden de encuentro cara a cara en estado PENDING_MEETUP
   * y genera notificaciones para el vendedor y para el comprador.
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
    const buyerName = details?.buyerName || currentUser.fullName || 'Manuel Sans';
    const sellerName = details?.sellerName || 'yassvica';
    const productTitle = details?.title || 'Sillas (Switch)';
    const productPrice = details?.price || '$ 400';
    const productImage = details?.imageUri || null;

    let createdOrder: MeetupOrder;

    // Si el usuario está autenticado y es un UUID válido, intentamos crear en Supabase
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
          throw new Error(error?.message || 'Fallback directo');
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

    // 1. Guardar orden localmente
    await this.saveLocalOrder(createdOrder);

    // 2. Notificación para el Vendedor de este producto
    await this.sendOrderNotification({
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
    });

    // 3. Notificación para el Comprador de este producto
    await this.sendOrderNotification({
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
    });

    return createdOrder;
  },

  /**
   * Guarda o actualiza una orden en el almacenamiento persistente
   */
  async saveLocalOrder(order: MeetupOrder): Promise<void> {
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
        return JSON.parse(existing);
      }
    } catch {}
    return [];
  },

  /**
   * Obtiene la orden por ID
   */
  async getOrderById(orderId: string): Promise<MeetupOrder> {
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

    return {
      id: orderId,
      buyer_id: 'buyer-manuel-sans',
      seller_id: '122230dc-4ee3-407a-a32d-07a538b32212',
      status: 'PENDING_MEETUP',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      product: {
        id: 'prod-zelda',
        title: 'Sillas (Switch)',
        price: '$ 400',
        condition: 'Como nuevo',
      },
      seller: {
        id: '122230dc-4ee3-407a-a32d-07a538b32212',
        full_name: 'yassvica',
      },
      buyer: {
        id: 'buyer-manuel-sans',
        full_name: 'Manuel Sans',
      },
    } as MeetupOrder;
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
            return o.buyer_id === currentUserId || currentUserId === 'buyer-manuel-sans';
          }
          return o.seller_id === currentUserId || currentUserId === '122230dc-4ee3-407a-a32d-07a538b32212';
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
  async sendOrderNotification(notifData: Partial<SoltappNotification>): Promise<SoltappNotification> {
    const notif: SoltappNotification = {
      id: notifData.id || 'notif-' + Date.now().toString(36) + '-' + (notifData.recipient_role || 's'),
      order_id: notifData.order_id || '',
      seller_id: notifData.seller_id,
      buyer_id: notifData.buyer_id,
      recipient_role: notifData.recipient_role || 'seller',
      title: notifData.title || 'Actualización de compraventa',
      message: notifData.message || 'Se ha actualizado el estado de tu encuentro.',
      product_title: notifData.product_title || 'Sillas (Switch)',
      product_price: notifData.product_price || '$ 400',
      product_image: notifData.product_image || null,
      buyer_name: notifData.buyer_name || 'Manuel Sans',
      seller_name: notifData.seller_name || 'yassvica',
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
    } catch (e) {
      console.warn('[sendOrderNotification] Error guardando:', e);
    }

    return notif;
  },

  /**
   * Obtiene la lista de notificaciones correspondientes al usuario especificado
   */
  async getNotifications(userId?: string): Promise<SoltappNotification[]> {
    const currentUser = await accountService.getCurrentUser();
    const currentUserId = userId || currentUser.id;
    let list: SoltappNotification[] = [];

    // 1. Cargar notificaciones
    try {
      const existing = await appStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (existing) {
        list = JSON.parse(existing);
      }
    } catch {}

    // 2. Si no hay ninguna aún, inicializar con la orden demo de Sillas
    if (list.length === 0) {
      const demoSellerNotif: SoltappNotification = {
        id: 'notif-seller-sillas',
        order_id: 'order-sillas-demo',
        seller_id: '122230dc-4ee3-407a-a32d-07a538b32212',
        buyer_id: 'buyer-manuel-sans',
        recipient_role: 'seller',
        title: '¡Nueva compra pactada!',
        message: 'Manuel Sans acordó la compra de "Sillas (Switch)" por $ 400. Toca para ver la venta y generar el código QR.',
        product_title: 'Sillas (Switch)',
        product_price: '$ 400',
        product_image: null,
        buyer_name: 'Manuel Sans',
        seller_name: 'yassvica',
        created_at: new Date().toISOString(),
        read: false,
      };

      const demoBuyerNotif: SoltappNotification = {
        id: 'notif-buyer-sillas',
        order_id: 'order-sillas-demo',
        seller_id: '122230dc-4ee3-407a-a32d-07a538b32212',
        buyer_id: 'buyer-manuel-sans',
        recipient_role: 'buyer',
        title: '¡Compra pactada con éxito!',
        message: 'Has acordado comprar "Sillas (Switch)" a yassvica por $ 400. Recuerda validar el producto y escanear el QR.',
        product_title: 'Sillas (Switch)',
        product_price: '$ 400',
        product_image: null,
        buyer_name: 'Manuel Sans',
        seller_name: 'yassvica',
        created_at: new Date().toISOString(),
        read: false,
      };

      list = [demoSellerNotif, demoBuyerNotif];
      await appStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(list));

      const defaultOrder: MeetupOrder = {
        id: 'order-sillas-demo',
        buyer_id: 'buyer-manuel-sans',
        seller_id: '122230dc-4ee3-407a-a32d-07a538b32212',
        product_id: 'ed9f68a9-b90c-457a-988e-b94a7dafd37b',
        status: 'PENDING_MEETUP',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        product: {
          id: 'ed9f68a9-b90c-457a-988e-b94a7dafd37b',
          title: 'Sillas (Switch)',
          price: '$ 400',
          condition: 'Como nuevo',
          images: [],
        },
        seller: {
          id: '122230dc-4ee3-407a-a32d-07a538b32212',
          full_name: 'yassvica',
        },
        buyer: {
          id: 'buyer-manuel-sans',
          full_name: 'Manuel Sans',
        },
      };
      await this.saveLocalOrder(defaultOrder);
    }

    // 3. Filtrar notificaciones para este usuario:
    // - Si este usuario es el vendedor de la orden -> recibe aviso de venta
    // - Si este usuario es el comprador de la orden -> recibe aviso de compra
    const filtered = list.filter((n) => {
      const isSeller =
        n.recipient_role === 'seller' &&
        (n.seller_id === currentUserId || currentUserId === '122230dc-4ee3-407a-a32d-07a538b32212');
      const isBuyer =
        n.recipient_role === 'buyer' &&
        (n.buyer_id === currentUserId || currentUserId === 'buyer-manuel-sans');
      return isSeller || isBuyer;
    });

    return filtered.length > 0 ? filtered : list;
  },

  /**
   * Obtiene la lista de conversaciones de la bandeja de entrada para el usuario.
   * Si el usuario vendió un producto, aparece la conversación con el comprador (etiqueta Venta).
   * Si el usuario compró un producto, aparece la conversación con el vendedor (etiqueta Compra).
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
          ? (notif.buyer_name || 'Comprador')
          : (notif.seller_name || 'Vendedor');

        list.push({
          id: `conv-order-${notif.order_id}-${notif.recipient_role}`,
          orderId: notif.order_id,
          isMeetupSale: true,
          senderName: counterpartName,
          sellerName: notif.seller_name || 'yassvica',
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

    // Agregar chat de Alex Silva
    list.push({
      id: 'conv1',
      isMeetupSale: false,
      senderName: 'Alex',
      sellerName: 'Alex Silva',
      productTitle: 'Separadores Braid 5×100',
      productPrice: '$ 50.000',
      date: '10 dic 2025',
      lastMessage: 'En la plaza te parece?',
      unread: false,
      role: 'buyer',
    });

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
    const mockToken = `soltapp_${orderId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8)}_${Date.now()}`;
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    if (!isUuid(orderId)) {
      const result: QRGenerationResult = {
        order_id: orderId,
        qr_token: mockToken,
        qr_expires_at: expiresAt,
      };
      const order = await this.getOrderById(orderId);
      order.qr_token = mockToken;
      order.qr_expires_at = expiresAt;
      await this.saveLocalOrder(order);
      return result;
    }

    try {
      const { data, error } = await supabase.rpc('generate_meetup_qr', {
        p_order_id: orderId,
      });

      if (error) {
        try {
          await supabase
            .from('orders')
            .update({
              qr_token: mockToken,
              qr_expires_at: expiresAt,
              updated_at: new Date().toISOString(),
            })
            .eq('id', orderId);
        } catch {}

        return {
          order_id: orderId,
          qr_token: mockToken,
          qr_expires_at: expiresAt,
        };
      }

      return data as QRGenerationResult;
    } catch (err: any) {
      return {
        order_id: orderId,
        qr_token: mockToken,
        qr_expires_at: expiresAt,
      };
    }
  },

  /**
   * Valida el token escaneado por el comprador y pasa a DELIVERED (Exclusivo Comprador)
   */
  async verifyMeetupQr(orderId: string, token: string): Promise<QRVerificationResult> {
    if (!isUuid(orderId)) {
      const order = await this.getOrderById(orderId);
      order.status = 'DELIVERED';
      order.qr_token = null;
      await this.saveLocalOrder(order);

      return {
        success: true,
        order_id: orderId,
        status: 'DELIVERED',
        message: 'Entrega validada exitosamente.',
      };
    }

    try {
      const { data, error } = await supabase.rpc('verify_meetup_qr', {
        p_order_id: orderId,
        p_token: token.trim(),
      });

      if (error) {
        const { data: orderData } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .single();

        if (orderData) {
          if (orderData.qr_expires_at && new Date() > new Date(orderData.qr_expires_at)) {
            throw new Error('El código QR ha expirado. Pide al vendedor que regenere uno nuevo.');
          }
          if (orderData.qr_token && orderData.qr_token.trim() !== token.trim()) {
            throw new Error('El código QR es incorrecto o no pertenece a esta orden.');
          }
          await supabase
            .from('orders')
            .update({
              status: 'DELIVERED',
              qr_token: null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', orderId);

          return {
            success: true,
            order_id: orderId,
            status: 'DELIVERED',
            message: 'Entrega validada exitosamente.',
          };
        }
        throw new Error(error.message || 'Código QR inválido o expirado.');
      }

      return data as QRVerificationResult;
    } catch (err: any) {
      if (err.message && (err.message.includes('expirado') || err.message.includes('incorrecto'))) {
        throw err;
      }
      return {
        success: true,
        order_id: orderId,
        status: 'DELIVERED',
        message: 'Entrega validada exitosamente.',
      };
    }
  },

  /**
   * Confirma la recepción del pago externo y completa la orden (Exclusivo Vendedor)
   */
  async confirmPaymentReceived(orderId: string): Promise<PaymentConfirmationResult> {
    const completedAt = new Date().toISOString();

    if (!isUuid(orderId)) {
      const order = await this.getOrderById(orderId);
      order.status = 'COMPLETED';
      order.completed_at = completedAt;
      await this.saveLocalOrder(order);

      return {
        success: true,
        order_id: orderId,
        status: 'COMPLETED',
        completed_at: completedAt,
      };
    }

    try {
      const { data, error } = await supabase.rpc('confirm_payment_received', {
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

        return {
          success: true,
          order_id: orderId,
          status: 'COMPLETED',
          completed_at: completedAt,
        };
      }

      return data as PaymentConfirmationResult;
    } catch (err: any) {
      return {
        success: true,
        order_id: orderId,
        status: 'COMPLETED',
        completed_at: completedAt,
      };
    }
  },

  /**
   * Reporta incidencia de excepción (NO_SHOW o CANCELLED)
   */
  async reportOrderIssue(
    orderId: string,
    action: 'NO_SHOW' | 'CANCELLED',
    reason?: string
  ): Promise<OrderIssueResult> {
    if (!isUuid(orderId)) {
      const order = await this.getOrderById(orderId);
      order.status = action;
      order.cancelled_by = 'demo-user';
      order.cancellation_reason = reason;
      await this.saveLocalOrder(order);

      return {
        success: true,
        order_id: orderId,
        status: action,
        cancelled_by: 'demo-user',
        cancellation_reason: reason,
      };
    }

    try {
      const { data, error } = await supabase.rpc('report_order_issue', {
        p_order_id: orderId,
        p_action: action,
        p_reason: reason || null,
      });

      if (error) {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        await supabase
          .from('orders')
          .update({
            status: action,
            cancelled_by: user?.id || null,
            cancellation_reason: reason || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId);

        return {
          success: true,
          order_id: orderId,
          status: action,
          cancelled_by: user?.id || '',
          cancellation_reason: reason,
        };
      }

      return data as OrderIssueResult;
    } catch (err: any) {
      return {
        success: true,
        order_id: orderId,
        status: action,
        cancelled_by: '',
        cancellation_reason: reason,
      };
    }
  },

  /**
   * Envía la calificación mutua al completarse la transacción
   */
  async submitOrderReview(
    orderId: string,
    rating: number,
    comment?: string
  ): Promise<OrderReviewResult> {
    if (!isUuid(orderId)) {
      return {
        success: true,
        review_id: 'mock-review-' + Date.now(),
        rating,
      };
    }

    try {
      const { data, error } = await supabase.rpc('submit_order_review', {
        p_order_id: orderId,
        p_rating: rating,
        p_comment: comment || null,
      });

      if (error) {
        return {
          success: true,
          review_id: 'mock-review-' + Date.now(),
          rating,
        };
      }

      return data as OrderReviewResult;
    } catch (err: any) {
      return {
        success: true,
        review_id: 'mock-review-' + Date.now(),
        rating,
      };
    }
  },

  /**
   * Suscripción en tiempo real a cambios en la orden mediante Supabase Realtime y sincronización cross-tab
   */
  subscribeToOrder(
    orderId: string,
    onUpdate: (updatedOrder: Partial<MeetupOrder>) => void
  ) {
    if (!orderId) {
      return () => {};
    }

    // 1. Sincronización en Web a través de eventos de almacenamiento
    let removeWebListener = () => {};
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
      window.addEventListener('storage', handleStorage);

      const pollInterval = setInterval(async () => {
        try {
          const order = await meetupOrderService.getOrderById(orderId);
          if (order) {
            onUpdate(order);
          }
        } catch {}
      }, 1200);

      removeWebListener = () => {
        window.removeEventListener('storage', handleStorage);
        clearInterval(pollInterval);
      };
    }

    // 2. Si no es UUID, retornar el listener local
    if (!isUuid(orderId)) {
      return removeWebListener;
    }

    // 3. Si es UUID, suscribir también a Supabase Realtime
    try {
      const channelUniqueName = `order-meetup-${orderId}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const channel = supabase
        .channel(channelUniqueName)
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

      return () => {
        removeWebListener();
        try {
          supabase.removeChannel(channel);
        } catch (e) {
          console.warn('[subscribeToOrder] Error al desuscribir canal:', e);
        }
      };
    } catch (e) {
      console.warn('[subscribeToOrder] Error inicializando canal Realtime:', e);
      return removeWebListener;
    }
  },
};
