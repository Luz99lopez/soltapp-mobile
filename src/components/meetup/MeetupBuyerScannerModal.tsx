import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { MeetupOrder } from '../../types/order.types';
import { meetupOrderService } from '../../services/meetupOrderService';

interface MeetupBuyerScannerModalProps {
  visible: boolean;
  order: MeetupOrder;
  onClose: () => void;
  onOrderUpdated: (updatedOrder: MeetupOrder) => void;
  onOpenIssueModal?: () => void;
}

const PRIMARY_TEAL = '#3BD7C2';
const TEXT_DARK = '#1F232E';
const MUTED_GRAY = '#6C757D';
const SUCCESS_GREEN = '#10B981';
const DANGER_RED = '#EF4444';
const WARNING_AMBER = '#F59E0B';

export const MeetupBuyerScannerModal: React.FC<MeetupBuyerScannerModalProps> = ({
  visible,
  order,
  onClose,
  onOrderUpdated,
  onOpenIssueModal,
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Modo manual (útil para Web o pruebas locales)
  const [manualCode, setManualCode] = useState('');
  const [showManualInput, setShowManualInput] = useState(Platform.OS === 'web');

  useEffect(() => {
    if (visible) {
      setScanned(false);
      setIsValidating(false);
      setErrorMessage(null);
      setSuccess(false);
      setManualCode('');
    }
  }, [visible]);

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (scanned || isValidating || success) return;

    setScanned(true);
    let extractedToken = data;

    try {
      const parsed = JSON.parse(data);
      if (parsed.token) {
        extractedToken = parsed.token;
      }
    } catch {
      // Data era un string de token directo
      extractedToken = data;
    }

    await validateToken(extractedToken);
  };

  const validateToken = async (tokenToVerify: string) => {
    if (!tokenToVerify || tokenToVerify.trim() === '') {
      setErrorMessage('Ingresa un código QR válido.');
      setScanned(false);
      return;
    }

    try {
      setIsValidating(true);
      setErrorMessage(null);

      const result = await meetupOrderService.verifyMeetupQr(order.id, tokenToVerify.trim());

      setSuccess(true);
      onOrderUpdated({
        ...order,
        status: 'DELIVERED',
      });
    } catch (err: any) {
      console.warn('[MeetupBuyerScannerModal] Error validando:', err);
      setErrorMessage(err.message || 'Código QR inválido o expirado. Pide al vendedor que regenere uno nuevo.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleRetry = () => {
    setScanned(false);
    setErrorMessage(null);
    setManualCode('');
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Validar Entrega en Persona</Text>
              <Text style={styles.headerSubtitle}>Escanea el código QR del vendedor</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={24} color={TEXT_DARK} />
            </TouchableOpacity>
          </View>

          {/* Banner de Advertencia Obligatorio */}
          <View style={styles.warningBanner}>
            <Ionicons name="warning-outline" size={22} color={WARNING_AMBER} style={{ marginRight: 8, marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.warningTitle}>Antes de escanear:</Text>
              <Text style={styles.warningText}>
                Revisa y prueba el producto minuciosamente en persona. Al escanear, confirmas que recibiste el artículo en condiciones y procederás a abonarlo directamente al vendedor.
              </Text>
            </View>
          </View>

          {/* ESTADO 1: Validación Exitosa */}
          {success ? (
            <View style={styles.successWrapper}>
              <View style={styles.successIconCircle}>
                <Ionicons name="checkmark-sharp" size={48} color="#FFFFFF" />
              </View>
              <Text style={styles.successTitle}>¡Entrega validada con éxito!</Text>
              <Text style={styles.successBody}>
                Has confirmado la recepción del producto. Ahora procede a pagar al vendedor en efectivo o por transferencia en el acto.
              </Text>

              <View style={styles.paymentDirectCard}>
                <Ionicons name="wallet-outline" size={24} color="#0D9488" style={{ marginRight: 10 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.paymentDirectTitle}>Pago directo al vendedor</Text>
                  <Text style={styles.paymentDirectText}>
                    Una vez que el vendedor reciba tu pago, confirmará en su app para finalizar la compra y permitir que se califiquen mutuamente.
                  </Text>
                </View>
              </View>

              <TouchableOpacity style={styles.finishBtn} onPress={onClose}>
                <Text style={styles.finishBtnText}>Entendido</Text>
              </TouchableOpacity>
            </View>
          ) : errorMessage ? (
            /* ESTADO 2: Error (Expirado o Inválido) */
            <View style={styles.errorWrapper}>
              <View style={styles.errorIconCircle}>
                <Ionicons name="alert-circle-outline" size={54} color={DANGER_RED} />
              </View>
              <Text style={styles.errorTitle}>No se pudo validar el código</Text>
              <Text style={styles.errorBody}>{errorMessage}</Text>

              <TouchableOpacity style={styles.retryBtn} onPress={handleRetry}>
                <Ionicons name="refresh" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.retryBtnText}>Reintentar escaneo</Text>
              </TouchableOpacity>

              {onOpenIssueModal && (
                <TouchableOpacity
                  style={styles.cancelLink}
                  onPress={() => {
                    onClose();
                    onOpenIssueModal();
                  }}
                >
                  <Text style={styles.cancelLinkText}>¿El producto no está bien o deseas cancelar?</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            /* ESTADO 3: Escaneo Activo o Entrada Manual */
            <View style={styles.scannerBody}>
              {isValidating ? (
                <View style={styles.loadingWrapper}>
                  <ActivityIndicator size="large" color={PRIMARY_TEAL} />
                  <Text style={styles.loadingText}>Validando código con el servidor...</Text>
                </View>
              ) : !showManualInput && Platform.OS !== 'web' ? (
                <View style={styles.cameraContainer}>
                  {!permission?.granted ? (
                    <View style={styles.permissionBox}>
                      <Ionicons name="camera-outline" size={48} color={MUTED_GRAY} />
                      <Text style={styles.permissionText}>
                        Necesitamos acceso a la cámara para escanear el QR del vendedor
                      </Text>
                      <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
                        <Text style={styles.permissionBtnText}>Permitir cámara</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <CameraView
                      style={styles.camera}
                      facing="back"
                      barcodeScannerSettings={{
                        barcodeTypes: ['qr'],
                      }}
                      onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
                    >
                      <View style={styles.cameraOverlay}>
                        <View style={styles.scanReticle}>
                          <View style={[styles.corner, styles.topLeft]} />
                          <View style={[styles.corner, styles.topRight]} />
                          <View style={[styles.corner, styles.bottomLeft]} />
                          <View style={[styles.corner, styles.bottomRight]} />
                        </View>
                        <Text style={styles.cameraInstructions}>
                          Apunta la cámara al código QR en la pantalla del vendedor
                        </Text>
                      </View>
                    </CameraView>
                  )}
                </View>
              ) : (
                /* Fallback Manual (ideal para simulador / Web) */
                <View style={styles.manualInputCard}>
                  <Text style={styles.manualLabel}>Ingresa el código o token de entrega:</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Ej. soltapp_abc123..."
                    placeholderTextColor="#9CA3AF"
                    value={manualCode}
                    onChangeText={setManualCode}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={styles.submitManualBtn}
                    activeOpacity={0.85}
                    onPress={() => validateToken(manualCode)}
                    disabled={!manualCode.trim()}
                  >
                    <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.submitManualBtnText}>Validar Entrega</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Botón switch entre cámara y manual */}
              {Platform.OS !== 'web' && (
                <TouchableOpacity
                  style={styles.switchModeBtn}
                  onPress={() => setShowManualInput(!showManualInput)}
                >
                  <Text style={styles.switchModeText}>
                    {showManualInput ? '📷 Usar cámara de escaneo' : '⌨️ Ingresar código manualmente'}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Opción de salida / problemas */}
              {onOpenIssueModal && (
                <TouchableOpacity
                  style={styles.exceptionBtn}
                  onPress={() => {
                    onClose();
                    onOpenIssueModal();
                  }}
                >
                  <Ionicons name="close-circle-outline" size={16} color={MUTED_GRAY} style={{ marginRight: 6 }} />
                  <Text style={styles.exceptionBtnText}>Cancelar encuentro o reportar problema</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 36,
    maxHeight: '92%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: TEXT_DARK,
  },
  headerSubtitle: {
    fontSize: 13,
    color: MUTED_GRAY,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
  },
  warningBanner: {
    flexDirection: 'row',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
  },
  warningTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
  },
  warningText: {
    fontSize: 12,
    color: '#78350F',
    marginTop: 2,
    lineHeight: 16,
  },
  scannerBody: {
    alignItems: 'center',
  },
  cameraContainer: {
    width: '100%',
    height: 300,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scanReticle: {
    width: 200,
    height: 200,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: PRIMARY_TEAL,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 8,
  },
  cameraInstructions: {
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 20,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  permissionBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F9FAFB',
  },
  permissionText: {
    fontSize: 13,
    color: MUTED_GRAY,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 16,
  },
  permissionBtn: {
    backgroundColor: PRIMARY_TEAL,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  permissionBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  loadingWrapper: {
    height: 240,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 14,
    fontSize: 14,
    color: MUTED_GRAY,
    fontWeight: '600',
  },
  manualInputCard: {
    width: '100%',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  manualLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_DARK,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: TEXT_DARK,
    marginBottom: 12,
  },
  submitManualBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY_TEAL,
    paddingVertical: 14,
    borderRadius: 12,
  },
  submitManualBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  switchModeBtn: {
    marginTop: 14,
    paddingVertical: 8,
  },
  switchModeText: {
    fontSize: 13,
    color: PRIMARY_TEAL,
    fontWeight: '600',
  },
  exceptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingVertical: 8,
  },
  exceptionBtnText: {
    fontSize: 13,
    color: MUTED_GRAY,
    textDecorationLine: 'underline',
  },
  successWrapper: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  successIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: SUCCESS_GREEN,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: TEXT_DARK,
    textAlign: 'center',
  },
  successBody: {
    fontSize: 14,
    color: MUTED_GRAY,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  paymentDirectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#99F6E4',
    borderRadius: 16,
    padding: 14,
    marginVertical: 18,
    width: '100%',
  },
  paymentDirectTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F766E',
  },
  paymentDirectText: {
    fontSize: 12,
    color: '#115E59',
    marginTop: 3,
    lineHeight: 17,
  },
  finishBtn: {
    backgroundColor: PRIMARY_TEAL,
    paddingVertical: 14,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
  },
  finishBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  errorWrapper: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  errorIconCircle: {
    marginBottom: 12,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: DANGER_RED,
    textAlign: 'center',
  },
  errorBody: {
    fontSize: 13,
    color: MUTED_GRAY,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY_TEAL,
    paddingVertical: 13,
    paddingHorizontal: 26,
    borderRadius: 14,
    marginTop: 20,
    width: '100%',
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  cancelLink: {
    marginTop: 16,
    paddingVertical: 6,
  },
  cancelLinkText: {
    fontSize: 13,
    color: MUTED_GRAY,
    textDecorationLine: 'underline',
  },
});
