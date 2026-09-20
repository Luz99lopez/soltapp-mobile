import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

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

export default function InboxView({ onOpenConversation }: InboxViewProps) {
  const [subTab, setSubTab] = useState<'messages' | 'notifications'>('messages');

  // Conversación de la bandeja de entrada según la captura
  const conversations: ConversationItem[] = [
    {
      id: 'conv1',
      senderName: 'Alex',
      sellerName: 'Alex Silva',
      productTitle: 'Separadores Braid 5×100',
      productPrice: '$ 50.000',
      date: '10 dic 2025',
    },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 1. Selector de Pestañas: Mensajes (3) | Notificaciones */}
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
            <View style={styles.badge}>
              <Text style={styles.badgeText}>3</Text>
            </View>
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
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Título "Bandeja de entrada" */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Bandeja de entrada</Text>
      </View>

      {/* Línea divisoria */}
      <View style={styles.divider} />

      {/* 3. Contenido según pestaña */}
      {subTab === 'messages' ? (
        <View style={styles.listContainer}>
          {conversations.map((item) => (
            <React.Fragment key={item.id}>
              <TouchableOpacity
                style={styles.conversationItem}
                activeOpacity={0.7}
                onPress={() => onOpenConversation(item)}
              >
                {/* Miniatura cuadrada redondeada en gris */}
                <View style={styles.itemThumb} />

                {/* Información de la conversación */}
                <View style={styles.itemContent}>
                  <View style={styles.itemTopRow}>
                    <Text style={styles.itemSender}>{item.senderName}</Text>
                    <Text style={styles.itemDate}>{item.date}</Text>
                  </View>
                  <Text style={styles.itemProduct} numberOfLines={1}>
                    {item.productTitle}
                  </Text>
                </View>
              </TouchableOpacity>
              <View style={styles.divider} />
            </React.Fragment>
          ))}
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No tienes notificaciones pendientes</Text>
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
    backgroundColor: '#E11D48',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },

  // 2. Encabezado
  titleContainer: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#000000',
    letterSpacing: -0.3,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    width: '100%',
  },

  // 3. Lista de conversaciones
  listContainer: {
    width: '100%',
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
  },
  itemThumb: {
    width: 62,
    height: 62,
    borderRadius: 12,
    backgroundColor: '#D1D5DB',
  },
  itemContent: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  itemTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemSender: {
    fontSize: 14,
    color: '#9098B1',
    fontWeight: '500',
  },
  itemDate: {
    fontSize: 12,
    color: '#9098B1',
    fontWeight: '400',
  },
  itemProduct: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
  },

  // Estado vacío
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#9098B1',
  },
});
