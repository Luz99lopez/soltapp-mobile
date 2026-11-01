import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { meetupOrderService, InboxConversationItem } from '../services/meetupOrderService';
import { accountService, SoltappUser } from '../services/accountService';
import { SoltappNotification } from '../types/order.types';

export interface ConversationItem {
  id: string;
  senderName: string;
  sellerName: string;
  productTitle: string;
  productPrice: string;
  date: string;
}

interface InboxViewProps {
  onOpenConversation: (conversation: ConversationItem) => void;
}

const PRIMARY_TEAL = '#3BD7C2';
const TEXT_DARK = '#1F232E';
const MUTED_GRAY = '#6C757D';

export default function InboxView({ onOpenConversation }: InboxViewProps) {
  const router = useRouter();
  const [subTab, setSubTab] = useState<'messages' | 'notifications'>('messages');
  const [currentUser, setCurrentUser] = useState<SoltappUser | null>(null);
  const [notifications, setNotifications] = useState<SoltappNotification[]>([]);
  const [conversations, setConversations] = useState<InboxConversationItem[]>([]);

  useEffect(() => {
    let isMounted = true;

    const loadInbox = async () => {
      try {
        const user = await accountService.getCurrentUser();
        if (isMounted) {
          setCurrentUser(user);
          const notifs = await meetupOrderService.getNotifications(user.id);
          const convs = await meetupOrderService.getInboxConversations(user.id);
          setNotifications(notifs);
          setConversations(convs);
        }
      } catch (e) {
        console.warn('[InboxView.loadInbox] Error:', e);
      }
    };

    loadInbox();

    const handleStorage = (e: any) => {
      if (
        !e ||
        e.key === '@soltapp_notifications' ||
        e.key === '@soltapp_meetup_orders' ||
        e.key === '@soltapp_active_user_id'
      ) {
        loadInbox();
      }
    };

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorage);
    }

    const interval = setInterval(loadInbox, 1500);

    return () => {
      isMounted = false;
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.removeEventListener('storage', handleStorage);
      }
      clearInterval(interval);
    };
  }, []);

  const handleOpenNotification = async (notif: SoltappNotification) => {
    await meetupOrderService.markNotificationAsRead(notif.id);
    const role = notif.recipient_role || 'seller';

    router.push({
      pathname: '/order/[id]',
      params: {
        id: notif.order_id,
        role: role, // Abre estrictamente con el rol que corresponde a esta orden
        title: notif.product_title,
        price: notif.product_price,
        sellerName: notif.seller_name || 'yassvica',
        buyerName: notif.buyer_name || 'Manuel Sans',
        imageUri: notif.product_image || '',
      },
    } as any);
  };

  const handleConversationPress = (item: InboxConversationItem) => {
    if (item.isMeetupSale && item.orderId) {
      router.push({
        pathname: '/order/[id]',
        params: {
          id: item.orderId,
          role: item.role, // Abre como Vendedor o como Comprador según esta transacción
          title: item.productTitle,
          price: item.productPrice,
          sellerName: item.sellerName || 'yassvica',
          buyerName: item.senderName || 'Manuel Sans',
          imageUri: item.productImage || '',
        },
      } as any);
    } else {
      onOpenConversation({
        id: item.id,
        senderName: item.senderName,
        sellerName: item.sellerName,
        productTitle: item.productTitle,
        productPrice: item.productPrice,
        date: item.date,
      });
    }
  };

  const unreadNotifCount = notifications.filter((n) => !n.read).length;
  const unreadMessagesCount = conversations.filter((c) => c.unread).length;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 1. Selector de Pestañas: Mensajes | Notificaciones */}
      <View style={styles.segmentContainer}>
        <View style={styles.segmentWrapper}>
          <TouchableOpacity
            style={[styles.segmentBtn, subTab === 'messages' && styles.segmentBtnActive]}
            onPress={() => setSubTab('messages')}
            activeOpacity={0.8}
          >
            <Text
              style={[styles.segmentBtnText, subTab === 'messages' && styles.segmentBtnTextActive]}
            >
              Mensajes
            </Text>
            {conversations.length > 0 && (
              <View
                style={[
                  styles.badge,
                  unreadMessagesCount > 0
                    ? { backgroundColor: '#E11D48' }
                    : { backgroundColor: '#9CA3AF' },
                ]}
              >
                <Text style={styles.badgeText}>{conversations.length}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, subTab === 'notifications' && styles.segmentBtnActive]}
            onPress={() => setSubTab('notifications')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.segmentBtnText,
                subTab === 'notifications' && styles.segmentBtnTextActive,
              ]}
            >
              Notificaciones
            </Text>
            {unreadNotifCount > 0 && (
              <View style={[styles.badge, { backgroundColor: PRIMARY_TEAL, marginLeft: 6 }]}>
                <Text style={[styles.badgeText, { color: '#0F766E' }]}>{unreadNotifCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Título de Sección Oficial */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>
          {subTab === 'messages' ? 'Bandeja de entrada' : 'Avisos y Notificaciones'}
        </Text>
        <Text style={styles.subtitle}>
          {subTab === 'messages'
            ? 'Gestiona tus compras, ventas y mensajes en curso.'
            : 'Avisos sobre el estado de tus encuentros y validación de entregas.'}
        </Text>
      </View>

      {/* Línea divisoria */}
      <View style={styles.divider} />

      {/* 3. Contenido según pestaña */}
      {subTab === 'messages' ? (
        <View style={styles.listContainer}>
          {conversations.length > 0 ? (
            conversations.map((item) => {
              const isSale = item.role === 'seller';
              return (
                <React.Fragment key={item.id}>
                  <TouchableOpacity
                    style={[
                      styles.conversationItem,
                      item.unread && styles.conversationItemUnread,
                    ]}
                    activeOpacity={0.7}
                    onPress={() => handleConversationPress(item)}
                  >
                    {/* Miniatura cuadrada o icono de transacción */}
                    <View style={styles.itemThumb}>
                      {item.productImage ? (
                        <Image source={{ uri: item.productImage }} style={styles.itemThumbImg} />
                      ) : item.isMeetupSale ? (
                        <View
                          style={[
                            styles.meetupSaleThumbIcon,
                            isSale ? styles.thumbIconSale : styles.thumbIconBuy,
                          ]}
                        >
                          <Ionicons
                            name={isSale ? 'storefront' : 'cart'}
                            size={22}
                            color={isSale ? '#0D9488' : '#4338CA'}
                          />
                        </View>
                      ) : (
                        <View style={styles.itemThumbPlaceholder} />
                      )}
                    </View>

                    {/* Información de la conversación */}
                    <View style={styles.itemContent}>
                      <View style={styles.itemTopRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
                          <Text style={styles.itemSender} numberOfLines={1}>
                            {item.senderName}
                          </Text>
                          {item.statusBadge && (
                            <View
                              style={[
                                styles.saleBadgePill,
                                isSale ? styles.saleBadgePillSeller : styles.saleBadgePillBuyer,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.saleBadgePillText,
                                  isSale ? styles.saleBadgePillTextSeller : styles.saleBadgePillTextBuyer,
                                ]}
                              >
                                {isSale ? 'Venta' : 'Compra'}
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.itemDate}>{item.date}</Text>
                      </View>

                      <Text style={styles.itemProduct} numberOfLines={1}>
                        {item.productTitle} • {item.productPrice}
                      </Text>

                      <Text
                        style={[
                          styles.itemLastMessage,
                          item.isMeetupSale && styles.itemLastMessageHighlighted,
                        ]}
                        numberOfLines={1}
                      >
                        {item.lastMessage}
                      </Text>
                    </View>

                    <Ionicons name="chevron-forward" size={16} color="#CBD5E1" style={{ marginLeft: 8 }} />
                  </TouchableOpacity>
                  <View style={styles.divider} />
                </React.Fragment>
              );
            })
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubble-ellipses-outline" size={40} color="#D1D5DB" style={{ marginBottom: 10 }} />
              <Text style={styles.emptyText}>No tienes mensajes ni tratos activos</Text>
              <Text style={styles.emptySubtext}>
                Tus conversaciones con vendedores y compradores cara a cara aparecerán aquí.
              </Text>
            </View>
          )}
        </View>
      ) : (
        /* Pestaña: Notificaciones Oficiales */
        <View style={styles.listContainer}>
          {notifications.length > 0 ? (
            notifications.map((notif) => {
              const isSeller = notif.recipient_role === 'seller';
              return (
                <React.Fragment key={notif.id}>
                  <TouchableOpacity
                    style={[
                      styles.notificationItem,
                      !notif.read && styles.notificationItemUnread,
                    ]}
                    activeOpacity={0.75}
                    onPress={() => handleOpenNotification(notif)}
                  >
                    <View style={styles.notifIconBubble}>
                      {notif.product_image ? (
                        <Image source={{ uri: notif.product_image }} style={styles.notifProductImg} />
                      ) : (
                        <Ionicons
                          name={isSeller ? 'storefront' : 'cart'}
                          size={22}
                          color={isSeller ? '#0D9488' : '#4338CA'}
                        />
                      )}
                    </View>

                    <View style={styles.notifContent}>
                      <View style={styles.notifTopRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={styles.notifTitle}>{notif.title}</Text>
                          <View
                            style={[
                              styles.saleBadgePill,
                              isSeller ? styles.saleBadgePillSeller : styles.saleBadgePillBuyer,
                              { marginLeft: 6 },
                            ]}
                          >
                            <Text
                              style={[
                                styles.saleBadgePillText,
                                isSeller ? styles.saleBadgePillTextSeller : styles.saleBadgePillTextBuyer,
                              ]}
                            >
                              {isSeller ? 'Venta' : 'Compra'}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.notifDate}>Reciente</Text>
                      </View>
                      <Text style={styles.notifBody}>{notif.message}</Text>

                      <View
                        style={[
                          styles.notifActionBtn,
                          !isSeller && { backgroundColor: '#EEF2FF', borderColor: '#C7D2FE' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.notifActionBtnText,
                            !isSeller && { color: '#4338CA' },
                          ]}
                        >
                          {isSeller
                            ? 'Ver venta y generar QR'
                            : 'Ver compra y escanear QR'}
                        </Text>
                        <Ionicons
                          name="chevron-forward"
                          size={14}
                          color={isSeller ? '#0D9488' : '#4338CA'}
                          style={{ marginLeft: 4 }}
                        />
                      </View>
                    </View>
                  </TouchableOpacity>
                  <View style={styles.divider} />
                </React.Fragment>
              );
            })
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="notifications-off-outline" size={42} color="#D1D5DB" style={{ marginBottom: 10 }} />
              <Text style={styles.emptyText}>No tienes avisos pendientes</Text>
              <Text style={styles.emptySubtext}>
                Las notificaciones sobre el estado de tus compras y ventas aparecerán aquí.
              </Text>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // 1. Selector Píldora
  segmentContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 6,
    alignItems: 'flex-start',
  },
  segmentWrapper: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 22,
    padding: 3,
    alignItems: 'center',
  },
  segmentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  segmentBtnActive: {
    backgroundColor: '#1F232E',
  },
  segmentBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F232E',
  },
  segmentBtnTextActive: {
    color: '#FFFFFF',
  },
  badge: {
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    marginLeft: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },

  // 2. Título
  titleContainer: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: TEXT_DARK,
  },
  subtitle: {
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 17,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },

  // 3. Lista
  listContainer: {
    paddingVertical: 4,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
  },
  conversationItemUnread: {
    backgroundColor: '#F0FDFA',
  },
  itemThumb: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
    marginRight: 14,
    overflow: 'hidden',
  },
  itemThumbImg: {
    width: '100%',
    height: '100%',
  },
  meetupSaleThumbIcon: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbIconSale: {
    backgroundColor: '#CCFBF1',
  },
  thumbIconBuy: {
    backgroundColor: '#E0E7FF',
  },
  itemThumbPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E2E8F0',
  },
  itemContent: {
    flex: 1,
  },
  itemTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  itemSender: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT_DARK,
  },
  saleBadgePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  saleBadgePillSeller: {
    backgroundColor: '#CCFBF1',
  },
  saleBadgePillBuyer: {
    backgroundColor: '#E0E7FF',
  },
  saleBadgePillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  saleBadgePillTextSeller: {
    color: '#0D9488',
  },
  saleBadgePillTextBuyer: {
    color: '#4338CA',
  },
  itemDate: {
    fontSize: 12,
    color: MUTED_GRAY,
  },
  itemProduct: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 2,
  },
  itemLastMessage: {
    fontSize: 12.5,
    color: MUTED_GRAY,
  },
  itemLastMessageHighlighted: {
    color: '#0D9488',
    fontWeight: '600',
  },

  // Notificaciones
  notificationItem: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
  },
  notificationItemUnread: {
    backgroundColor: '#F0FDFA',
  },
  notifIconBubble: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    overflow: 'hidden',
  },
  notifProductImg: {
    width: 48,
    height: 48,
  },
  notifContent: {
    flex: 1,
  },
  notifTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notifTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: TEXT_DARK,
  },
  notifDate: {
    fontSize: 11,
    color: MUTED_GRAY,
  },
  notifBody: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
    marginBottom: 8,
  },
  notifActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6FFFA',
    alignSelf: 'flex-start',
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#99F6E4',
  },
  notifActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0D9488',
  },

  emptyContainer: {
    padding: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT_DARK,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 13,
    color: MUTED_GRAY,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 19,
    paddingHorizontal: 10,
  },
});
