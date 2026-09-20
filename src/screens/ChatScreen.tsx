import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Iconos SVG oficiales de assets/svgs
import FlechaVolverIcon from '../../assets/svgs/Flecha volver.svg';
import EstrellaIcon from '../../assets/svgs/Estrella.svg';
import AvatarIcon from '../../assets/svgs/Avatar.svg';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'other';
  text: string;
  time: string;
  status?: 'sent' | 'delivered' | 'read';
}

const STORAGE_KEY = '@soltapp_chat_messages_alex_silva';

export default function ChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    productTitle?: string;
    productPrice?: string;
    sellerName?: string;
  }>();

  const productTitle = params.productTitle || 'Separadores Braid 5×100';
  const productPrice = params.productPrice || '$ 50.000';
  const sellerName = params.sellerName || 'Alex Silva';

  const scrollViewRef = useRef<ScrollView>(null);

  // Mensajes iniciales exactos a la imagen de referencia
  const initialMessages: ChatMessage[] = [
    {
      id: 'm1',
      sender: 'user',
      text: 'Hola buenas tardes! , Me interesa el producto , podemos coordinar para verlo ?',
      time: '15:48',
      status: 'read',
    },
    {
      id: 'm2',
      sender: 'other',
      text: 'Hola , Obvio soy de Pilar',
      time: '15:48',
    },
    {
      id: 'm3',
      sender: 'other',
      text: 'En la plaza te parece?',
      time: '15:48',
    },
  ];

  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputText, setInputText] = useState('');
  const [isTypingBarVisible, setIsTypingBarVisible] = useState(false);
  const [isCounterpartTyping, setIsCounterpartTyping] = useState(false);

  // Cargar historial guardado o iniciar con los mensajes por defecto
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMessages(parsed);
          }
        }
      } catch {
        // En caso de error, mantener mensajes iniciales
      }
    })();
  }, []);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/home?tab=inbox' as any);
    }
  };

  const getCurrentTime = () => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const sendMessage = async () => {
    const trimmed = inputText.trim();
    if (!trimmed) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: trimmed,
      time: getCurrentTime(),
      status: 'read',
    };

    const updated = [...messages, newMessage];
    setMessages(updated);
    setInputText('');

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignorar error de almacenamiento
    }

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    // Simular respuesta automática del vendedor
    setIsCounterpartTyping(true);
    setTimeout(async () => {
      setIsCounterpartTyping(false);
      const automatedReplies = [
        '¡Dale, dale! Ahí nos vemos entonces.',
        'Perfecto, a esa hora me queda bien.',
        '¿Llegas bien o te paso la ubicación exacta?',
        '¡Genial! Ya lo separo para vos.',
      ];
      const randomReply = automatedReplies[Math.floor(Math.random() * automatedReplies.length)];

      const sellerMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'other',
        text: randomReply,
        time: getCurrentTime(),
      };

      setMessages((prev) => {
        const nextList = [...prev, sellerMessage];
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextList)).catch(() => {});
        return nextList;
      });

      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }, 1800);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* 1. Header con Producto y Retroceso */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <FlechaVolverIcon width={24} height={24} stroke="#000000" />
        </TouchableOpacity>

        {/* Miniatura cuadrada redondeada del producto */}
        <View style={styles.productThumb}>
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=200&q=80',
            }}
            style={styles.productThumbImg}
          />
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
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
        >
          {/* 2. Cabecera del Perfil del Vendedor */}
          <View style={styles.sellerContainer}>
            <View style={styles.sellerAvatarCircle}>
              <AvatarIcon width={48} height={48} fill="#9CA3AF" />
            </View>

            <Text style={styles.sellerName}>{sellerName}</Text>

            <View style={styles.statsRow}>
              <View style={styles.statColumn}>
                <View style={styles.ratingRow}>
                  <EstrellaIcon width={16} height={16} fill="#000000" />
                  <Text style={styles.ratingValue}>4,8</Text>
                </View>
                <Text style={styles.ratingCount}>124 valoraciones</Text>
              </View>

              <View style={styles.statColumn}>
                <Text style={styles.responseLabel}>Responde en</Text>
                <Text style={styles.responseValue}>24 horas</Text>
              </View>
            </View>
          </View>

          {/* 3. Divisor de Fecha */}
          <View style={styles.dateDividerContainer}>
            <Text style={styles.dateDividerText}>10 dic 2025</Text>
          </View>

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
                          name="checkmark-done"
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

            {isCounterpartTyping && (
              <View style={[styles.messageBubbleWrapper, styles.otherBubbleWrapper]}>
                <View style={[styles.messageBubble, styles.otherBubble, styles.typingBubble]}>
                  <Text style={styles.typingText}>Alex Silva está escribiendo...</Text>
                </View>
              </View>
            )}
          </View>

          {/* 5. Botón Inferior "Chatea" */}
          {!isTypingBarVisible && (
            <View style={styles.actionButtonContainer}>
              <TouchableOpacity
                style={styles.chateaButton}
                activeOpacity={0.8}
                onPress={() => setIsTypingBarVisible(true)}
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
              onChangeText={setInputText}
              multiline
              autoFocus
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                !inputText.trim() && styles.sendButtonDisabled,
              ]}
              onPress={sendMessage}
              disabled={!inputText.trim()}
              activeOpacity={0.8}
            >
              <Ionicons
                name="send"
                size={18}
                color={inputText.trim() ? '#111827' : '#9CA3AF'}
              />
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
