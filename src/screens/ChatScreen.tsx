import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useChatThread } from '../hooks/useChatThread';
import { formatProductPrice } from '../utils/productPresentation';

// Iconos SVG oficiales de assets/svgs
import FlechaVolverIcon from '../../assets/svgs/Flecha volver.svg';
import AvatarIcon from '../../assets/svgs/Avatar.svg';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'other';
  text: string;
  time: string;
  status?: 'sent' | 'delivered' | 'read';
}

export default function ChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    productId?: string;
    conversationId?: string;
    sellerId?: string;
    buyerId?: string;
    imageUri?: string;
    productTitle?: string;
    productPrice?: string;
    sellerName?: string;
  }>();

  const thread = useChatThread({ conversationId: params.conversationId, productId: params.productId });
  const productTitle = thread.context ? thread.context.product?.title || 'Publicación no disponible' : params.productTitle || 'Conversación';
  const productPrice = thread.context?.product ? formatProductPrice(thread.context.product.price, thread.context.product.currency) : '';
  const sellerName = thread.context?.counterpartName || 'Participante';
  const images = thread.context?.product?.images || [];
  const cover = (images.find(image => image.is_cover) || images[0])?.image_url || params.imageUri;

  const scrollViewRef = useRef<React.ComponentRef<typeof ScrollView>>(null);

  const messages = thread.messages.map(message => ({ id: message.id, sender: message.sender_id === thread.context?.userId ? 'user' : 'other', text: message.body, time: new Date(message.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) }));
  const [inputText, setInputText] = useState('');
  const [isTypingBarVisible, setIsTypingBarVisible] = useState(false);
  useEffect(() => { setInputText(''); setIsTypingBarVisible(false); }, [thread.context?.userId]);
  const lastMessageId = messages[messages.length - 1]?.id;
  useEffect(() => { scrollViewRef.current?.scrollToEnd({ animated: false }); }, [lastMessageId]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/home?tab=inbox' as any);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !thread.context || thread.loading || thread.sending) return;
    if (await thread.send(inputText)) setInputText('');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* 1. Header con Producto y Retroceso */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          accessibilityRole="button"
          accessibilityLabel="Volver"
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <FlechaVolverIcon width={24} height={24} stroke="#000000" />
        </TouchableOpacity>

        {/* Miniatura cuadrada redondeada del producto */}
        <View style={styles.productThumb}>
          {cover ? <Image source={{ uri: cover }} style={styles.productThumbImg} /> : <Ionicons name="image-outline" size={24} color="#9098B1" />}
        </View>

        {/* Datos del producto: Precio y Título */}
        <View style={styles.productInfo}>
          <Text style={styles.productPrice}>{productPrice}</Text>
          <Text style={styles.productTitle} numberOfLines={1}>
            {productTitle}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 2. Cabecera del Perfil del Vendedor */}
          <View style={styles.sellerContainer}>
            <View style={styles.sellerAvatarCircle}>
              <AvatarIcon width={48} height={48} fill="#9CA3AF" />
            </View>

            <Text style={styles.sellerName}>{sellerName}</Text>

            {thread.offline ? <Text style={styles.responseLabel} role="status" accessibilityLiveRegion="polite">Sin conexión con el chat. Tu borrador se conserva.</Text> : thread.context && <Text style={styles.responseLabel}>{thread.live ? 'Conectado al chat' : 'Los mensajes se sincronizan automáticamente'}</Text>}
          </View>

          {/* 3. Divisor de Fecha */}
          <View style={styles.dateDividerContainer}>
            <Text style={styles.dateDividerText}>{thread.messages[0] ? new Date(thread.messages[0].created_at).toLocaleDateString('es-AR') : 'Conversación sobre este artículo'}</Text>
          </View>
          {thread.loading && <View style={styles.statusBox} role="status" accessibilityLiveRegion="polite"><ActivityIndicator color="#0D9488" /><Text>Cargando conversación...</Text></View>}
          {thread.sending && <Text style={styles.emptyText} role="status" accessibilityLiveRegion="polite">Enviando mensaje...</Text>}
          {!!(thread.error || thread.syncError) && <View style={styles.statusBox}>
            <Text accessibilityRole="alert">{thread.error || thread.syncError}</Text>
            {!thread.context && <TouchableOpacity accessibilityRole="button" onPress={thread.reload}><Text style={styles.retryText}>Reintentar</Text></TouchableOpacity>}
            {!!thread.syncError && !!thread.context && <TouchableOpacity accessibilityRole="button" onPress={thread.refresh}><Text style={styles.retryText}>Actualizar conversación</Text></TouchableOpacity>}
            {thread.needsLogin && <TouchableOpacity accessibilityRole="button" onPress={() => router.push('/login')}><Text style={styles.retryText}>Iniciar sesión</Text></TouchableOpacity>}
          </View>}
          {!thread.loading && thread.context && !messages.length && <Text style={styles.emptyText}>Todavía no hay mensajes. Podés iniciar la conversación.</Text>}
          {thread.hasOlder && <TouchableOpacity accessibilityRole="button" disabled={thread.loadingOlder} onPress={thread.loadOlder} style={styles.statusBox}><Text>{thread.loadingOlder ? 'Cargando...' : 'Cargar mensajes anteriores'}</Text></TouchableOpacity>}

          {/* 4. Conversación / Burbujas de Chat */}
          <View style={styles.messagesList}>
            {messages.map((item) => {
              const isUser = item.sender === 'user';

              return (
                <View
                  key={item.id}
                  style={[
                    styles.messageBubbleWrapper,
                    isUser ? styles.userBubbleWrapper : styles.otherBubbleWrapper,
                  ]}
                >
                  <View
                    style={[
                      styles.messageBubble,
                      isUser ? styles.userBubble : styles.otherBubble,
                    ]}
                  >
                    <Text style={styles.messageText}>{item.text}</Text>

                    <View style={styles.metaRow}>
                      <Text style={styles.timeText}>{item.time}</Text>
                      {isUser && (
                        <Ionicons
                          name="checkmark"
                          accessibilityLabel="Guardado"
                          size={15}
                          color="#111827"
                          style={styles.checkIcon}
                        />
                      )}
                    </View>
                  </View>
                </View>
              );
            })}

          </View>

          {/* 5. Botón Inferior "Chatea" */}
          {!isTypingBarVisible && (
            <View style={styles.actionButtonContainer}>
              <TouchableOpacity
                style={styles.chateaButton}
                accessibilityRole="button"
                accessibilityLabel="Chatea"
                activeOpacity={0.8}
                onPress={() => setIsTypingBarVisible(true)}
                disabled={!thread.context || thread.loading}
              >
                <Text style={styles.chateaButtonText}>Chatea</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {/* 6. Barra Interactiva de Texto */}
        {isTypingBarVisible && (
          <View style={styles.inputContainer}>
            <TouchableOpacity
              style={styles.closeInputBtn}
              onPress={() => setIsTypingBarVisible(false)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="chevron-down" size={22} color="#6B7280" />
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              placeholder="Escribe un mensaje..."
              placeholderTextColor="#9CA3AF"
              value={inputText}
              accessibilityLabel="Mensaje"
              maxLength={4000}
              editable={!thread.sending && !!thread.context}
              onChangeText={setInputText}
              multiline
              returnKeyType="send"
              submitBehavior={Platform.OS === 'web' ? undefined : 'submit'}
              onSubmitEditing={sendMessage}
              onKeyPress={Platform.OS === 'web' ? event => {
                const key = event.nativeEvent as typeof event.nativeEvent & { shiftKey?: boolean; isComposing?: boolean; keyCode?: number };
                if (key.key === 'Enter' && !key.shiftKey && !key.isComposing && key.keyCode !== 229) {
                  event.preventDefault();
                  void sendMessage();
                }
              } : undefined}
              autoFocus
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                !inputText.trim() && styles.sendButtonDisabled,
              ]}
              onPress={sendMessage}
              disabled={!inputText.trim() || thread.sending || !thread.context || thread.loading}
              accessibilityRole="button"
              accessibilityLabel={thread.sending ? 'Enviando mensaje' : 'Enviar mensaje'}
              activeOpacity={0.8}
            >
              {thread.sending ? <ActivityIndicator color="#0D9488" /> : <Ionicons
                name="send"
                size={18}
                color={inputText.trim() ? '#111827' : '#9CA3AF'}
              />}
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const CHAT_USER_BG = '#B4F4EB'; // Color solicitado para la burbuja de chat
const CHAT_OTHER_BG = '#D9D9D9'; // Gris idéntico al mockup

const styles = StyleSheet.create({
  statusBox: { padding: 16, alignItems: 'center', gap: 12 },
  retryText: { color: '#0D9488', fontWeight: '700', padding: 8 },
  emptyText: { padding: 20, textAlign: 'center', color: '#64748B' },
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // 1. Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    paddingRight: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productThumb: {
    width: 46,
    height: 46,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productThumbImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  productInfo: {
    marginLeft: 14,
    justifyContent: 'center',
    flex: 1,
  },
  productPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: '#000000',
    letterSpacing: -0.3,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
    marginTop: 1,
  },

  // Scroll Content
  scroll: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 30,
  },

  // 2. Perfil del Vendedor
  sellerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  sellerAvatarCircle: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  sellerName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#000000',
    marginTop: 12,
    marginBottom: 22,
  },
  statsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
  },
  statColumn: {
    alignItems: 'center',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  ratingValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#000000',
  },
  ratingCount: {
    fontSize: 14,
    color: '#1F232E',
    marginTop: 4,
  },
  responseLabel: {
    fontSize: 14,
    color: '#1F232E',
  },
  responseValue: {
    fontSize: 14,
    color: '#1F232E',
    marginTop: 4,
  },

  // 3. Divisor de Fecha
  dateDividerContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 24,
  },
  dateDividerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#71717A',
  },

  // 4. Mensajes y Burbujas
  messagesList: {
    width: '100%',
    gap: 12,
  },
  messageBubbleWrapper: {
    width: '100%',
    flexDirection: 'row',
  },
  userBubbleWrapper: {
    justifyContent: 'flex-start',
  },
  otherBubbleWrapper: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: '85%',
  },
  userBubble: {
    backgroundColor: CHAT_USER_BG, // #B4F4EB
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
    borderBottomLeftRadius: 18,
  },
  otherBubble: {
    backgroundColor: CHAT_OTHER_BG, // #D9D9D9
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
    borderBottomLeftRadius: 18,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#000000',
    fontWeight: '400',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    gap: 4,
  },
  timeText: {
    fontSize: 11,
    color: '#374151',
    fontWeight: '500',
  },
  checkIcon: {
    marginLeft: 2,
  },
  typingBubble: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#E5E7EB',
  },
  typingText: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },

  // 5. Botón Chatea
  actionButtonContainer: {
    alignItems: 'center',
    marginTop: 36,
    marginBottom: 20,
  },
  chateaButton: {
    width: '72%',
    maxWidth: 260,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#000000',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chateaButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#000000',
  },

  // 6. Barra interactiva de texto
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    gap: 10,
  },
  closeInputBtn: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 90,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
    color: '#111827',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: CHAT_USER_BG,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
});
