import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Alert,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';
import { MeetupOrder } from '../../types/order.types';
import { meetupOrderService } from '../../services/meetupOrderService';

interface MeetupSellerQRModalProps {
  visible: boolean;
  order: MeetupOrder;
  onClose: () => void;
  onOrderUpdated: (updatedOrder: MeetupOrder) => void;
  onOpenIssueModal?: () => void;
}

const PRIMARY_TEAL = '#3BD7C2';
const TEXT_DARK = '#1F232E';
const MUTED_GRAY = '#6C757D';
const BORDER_COLOR = '#E5E7EB';
const SUCCESS_GREEN = '#10B981';
const DANGER_RED = '#EF4444';

export const MeetupSellerQRModal: React.FC<MeetupSellerQRModalProps> = ({
  visible,
  order,
  onClose,
  onOrderUpdated,
  onOpenIssueModal,
}) => {
  const [token, setToken] = useState<string | null>(order.qr_token || null);
  const [expiresAt, setExpiresAt] = useState<string | null>(order.qr_expires_at || null);
  const [timeLeft, setTimeLeft] = useState<number>(300); // 5 min default
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isConfirmingPayment, setIsConfirmingPayment] = useState<boolean>(false);
  const [isExpired, setIsExpired] = useState<boolean>(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Manejo de expiración y cuenta regresiva
  useEffect(() => {
    if (!visible) return;

    if (!token) {
      handleGenerateQr();
    }
  }, [visible]);

  useEffect(() => {
    if (!expiresAt) return;

    const calculateTimeLeft = () => {
      const expDate = new Date(expiresAt).getTime();
      const now = new Date().getTime();
      const diffSec = Math.max(0, Math.floor((expDate - now) / 1000));

      setTimeLeft(diffSec);
      if (diffSec <= 0) {
        setIsExpired(true);
      } else {
        setIsExpired(false);
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  // Animación de pulso cuando está activo
  useEffect(() => {
    if (!isExpired && order.status === 'PENDING_MEETUP') {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.03,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    }
  }, [isExpired, order.status]);

  // Suscripción Realtime a cambios de la orden mientras el modal está abierto
  useEffect(() => {
    if (!visible || !order.id) return;

    const unsubscribe = meetupOrderService.subscribeToOrder(order.id, (updatedFields) => {
      console.log('[MeetupSellerQRModal] Orden actualizada en tiempo real:', updatedFields);
      if (updatedFields.status) {
        const mergedOrder = { ...order, ...updatedFields } as MeetupOrder;
        onOrderUpdated(mergedOrder);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [visible, order.id]);

  const handleGenerateQr = async () => {
    try {
      setIsGenerating(true);
      setIsExpired(false);
      const result = await meetupOrderService.generateMeetupQr(order.id);
      setToken(result.qr_token);
      setExpiresAt(result.qr_expires_at);
      onOrderUpdated({
        ...order,
        qr_token: result.qr_token,
        qr_expires_at: result.qr_expires_at,
      });
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo generar el código QR.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirmPayment = async () => {
    try {
      setIsConfirmingPayment(true);
      const result = await meetupOrderService.confirmPaymentReceived(order.id);
      Alert.alert('¡Excelente!', 'Has confirmado la recepción del pago. La venta ha finalizado con éxito.');
      onOrderUpdated({
        ...order,
        status: 'COMPLETED',
        completed_at: result.completed_at,
      });
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo confirmar el pago.');
    } finally {
      setIsConfirmingPayment(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Valor a codificar en el QR
  const qrPayload = JSON.stringify({
    soltapp: true,
    orderId: order.id,
    token: token || '',
  });

  const isDelivered = order.status === 'DELIVERED';
  const isCompleted = order.status === 'COMPLETED';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Validador de Entrega</Text>
              <Text style={styles.subtitle}>Encuentro cara a cara sin intermediarios</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={24} color={TEXT_DARK} />
            </TouchableOpacity>
          </View>

          {/* ESTADO 1: Entrega validada (DELIVERED) -> Espera pago externo */}
          {isDelivered && (
            <View style={styles.deliveredBox}>
              <View style={styles.successIconBubble}>
                <Ionicons name="checkmark-done-circle" size={48} color={SUCCESS_GREEN} />
              </View>
              <Text style={styles.deliveredTitle}>¡Entrega física validada!</Text>
              <Text style={styles.deliveredSubtitle}>
                El comprador ha escaneado tu código y confirmó la recepción física del producto.
              </Text>

              <View style={styles.paymentNoticeCard}>
                <Ionicons name="cash-outline" size={26} color="#0D9488" style={{ marginRight: 10 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.paymentNoticeTitle}>Paso final: Cobro externo</Text>
                  <Text style={styles.paymentNoticeText}>
                    Asegúrate de recibir el dinero en mano (efectivo o transferencia) antes de presionar el botón de abajo.
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.confirmPaymentBtn}
                activeOpacity={0.85}
                onPress={handleConfirmPayment}
                disabled={isConfirmingPayment}
              >
                {isConfirmingPayment ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="shield-checkmark" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.confirmPaymentBtnText}>Confirmar que recibí el pago</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* ESTADO 2: Orden ya completada */}
          {isCompleted && (
            <View style={styles.completedBox}>
              <Ionicons name="trophy" size={54} color="#F59E0B" />
              <Text style={styles.deliveredTitle}>¡Venta completada!</Text>
              <Text style={styles.deliveredSubtitle}>
                El pago y la entrega han sido confirmados. Ahora ambos pueden dejar una calificación para su reputación.
              </Text>
              <TouchableOpacity style={styles.closeActionBtn} onPress={onClose}>
                <Text style={styles.closeActionBtnText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ESTADO 3: PENDING_MEETUP -> Generar / Mostrar QR */}
          {!isDelivered && !isCompleted && (
            <View style={styles.qrContentWrapper}>
              {/* Timer de vigencia */}
              <View style={[styles.timerPill, isExpired && styles.timerPillExpired]}>
                <Ionicons
                  name={isExpired ? 'alert-circle-outline' : 'time-outline'}
                  size={18}
                  color={isExpired ? DANGER_RED : '#0D9488'}
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.timerText, isExpired && styles.timerTextExpired]}>
                  {isExpired ? 'QR Expirado' : `Vigencia: ${formatTimer(timeLeft)}`}
                </Text>
              </View>

              {/* QR Container */}
              <Animated.View
                style={[
                  styles.qrCard,
                  { transform: [{ scale: pulseAnim }] },
                  isExpired && styles.qrCardExpired,
                ]}
              >
                {isGenerating ? (
                  <View style={styles.qrPlaceholder}>
                    <ActivityIndicator size="large" color={PRIMARY_TEAL} />
                    <Text style={styles.generatingText}>Generando QR dinámico...</Text>
                  </View>
                ) : token && !isExpired ? (
                  <View style={styles.qrInnerWrapper}>
                    <QRCode
                      value={qrPayload}
                      size={200}
                      color="#1F232E"
                      backgroundColor="#FFFFFF"
                    />
                    <Text style={styles.tokenCaption}>Token: {token.slice(0, 10)}...</Text>
                  </View>
                ) : (
                  <View style={styles.qrPlaceholder}>
                    <Ionicons name="refresh-circle-outline" size={60} color={DANGER_RED} />
                    <Text style={styles.expiredPrompt}>El código ha expirado por seguridad</Text>
                  </View>
                )}
              </Animated.View>

              {/* Instrucción clara para el vendedor */}
              <Text style={styles.sellerInstructions}>
                Pídele al comprador que abra la cámara de Soltapp y escanee este código una vez que haya probado el producto.
              </Text>

              {/* Botón Regenerar si expiró */}
              {isExpired ? (
                <TouchableOpacity
                  style={styles.regenerateBtn}
                  activeOpacity={0.85}
                  onPress={handleGenerateQr}
                  disabled={isGenerating}
                >
                  <Ionicons name="reload" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.regenerateBtnText}>Regenerar nuevo QR</Text>
                </TouchableOpacity>
              ) : null}

              {/* Acciones de Excepción */}
              {onOpenIssueModal && (
                <TouchableOpacity
                  style={styles.issueLink}
                  onPress={() => {
                    onClose();
                    onOpenIssueModal();
                  }}
                >
                  <Ionicons name="warning-outline" size={16} color={MUTED_GRAY} style={{ marginRight: 6 }} />
                  <Text style={styles.issueLinkText}>¿Hubo un problema o no se presentó?</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 36,
    maxHeight: '90%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: TEXT_DARK,
  },
  subtitle: {
    fontSize: 13,
    color: MUTED_GRAY,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
  },
  qrContentWrapper: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  timerPillExpired: {
    backgroundColor: '#FEE2E2',
  },
  timerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0D9488',
  },
  timerTextExpired: {
    color: DANGER_RED,
  },
  qrCard: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 250,
    minWidth: 250,
  },
  qrCardExpired: {
    opacity: 0.6,
    borderColor: '#FCA5A5',
  },
  qrInnerWrapper: {
    alignItems: 'center',
  },
  tokenCaption: {
    fontSize: 11,
    color: MUTED_GRAY,
    marginTop: 10,
    fontFamily: 'monospace',
  },
  qrPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  generatingText: {
    marginTop: 12,
    fontSize: 14,
    color: MUTED_GRAY,
    fontWeight: '500',
  },
  expiredPrompt: {
    marginTop: 12,
    fontSize: 14,
    color: DANGER_RED,
    fontWeight: '600',
    textAlign: 'center',
  },
  sellerInstructions: {
    fontSize: 13,
    color: MUTED_GRAY,
    textAlign: 'center',
    marginTop: 18,
    lineHeight: 19,
    paddingHorizontal: 12,
  },
  regenerateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY_TEAL,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    marginTop: 16,
    width: '100%',
  },
  regenerateBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  issueLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    paddingVertical: 6,
  },
  issueLinkText: {
    fontSize: 13,
    color: MUTED_GRAY,
    textDecorationLine: 'underline',
  },
  deliveredBox: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  successIconBubble: {
    marginBottom: 10,
  },
  deliveredTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: TEXT_DARK,
    textAlign: 'center',
  },
  deliveredSubtitle: {
    fontSize: 14,
    color: MUTED_GRAY,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  paymentNoticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#99F6E4',
    borderRadius: 16,
    padding: 14,
    marginVertical: 20,
    width: '100%',
  },
  paymentNoticeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F766E',
  },
  paymentNoticeText: {
    fontSize: 12,
    color: '#115E59',
    marginTop: 2,
    lineHeight: 17,
  },
  confirmPaymentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SUCCESS_GREEN,
    paddingVertical: 16,
    borderRadius: 16,
    width: '100%',
    shadowColor: SUCCESS_GREEN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmPaymentBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  completedBox: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  closeActionBtn: {
    marginTop: 20,
    backgroundColor: PRIMARY_TEAL,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 14,
  },
  closeActionBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
