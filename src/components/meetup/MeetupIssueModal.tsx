import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MeetupOrder } from '../../types/order.types';
import { meetupOrderService } from '../../services/meetupOrderService';

interface MeetupIssueModalProps {
  visible: boolean;
  order: MeetupOrder;
  onClose: () => void;
  onOrderUpdated: (updatedOrder: MeetupOrder) => void;
}

const PRIMARY_TEAL = '#3BD7C2';
const TEXT_DARK = '#1F232E';
const MUTED_GRAY = '#6C757D';
const DANGER_RED = '#EF4444';
const WARNING_AMBER = '#F59E0B';

export const MeetupIssueModal: React.FC<MeetupIssueModalProps> = ({
  visible,
  order,
  onClose,
  onOrderUpdated,
}) => {
  const [selectedAction, setSelectedAction] = useState<'NO_SHOW' | 'CANCELLED'>('NO_SHOW');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (selectedAction === 'CANCELLED' && !reason.trim()) {
      Alert.alert('Motivo requerido', 'Por favor describe brevemente por qué cancelas el encuentro.');
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await meetupOrderService.reportOrderIssue(
        order.id,
        selectedAction,
        reason.trim() || undefined
      );

      Alert.alert(
        selectedAction === 'NO_SHOW' ? 'Inasistencia reportada' : 'Encuentro cancelado',
        selectedAction === 'NO_SHOW'
          ? 'Hemos registrado el reporte de inasistencia. Se evaluará el strike en la reputación del ausente.'
          : 'El encuentro ha sido cancelado sin penalizaciones económicas.',
        [{ text: 'Entendido', onPress: onClose }]
      );

      onOrderUpdated({
        ...order,
        status: result.status,
        cancelled_by: result.cancelled_by,
        cancellation_reason: result.cancellation_reason,
      });
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo procesar el reporte.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Reportar o Cancelar</Text>
              <Text style={styles.headerSubtitle}>Gestión de incidencias del encuentro</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={TEXT_DARK} />
            </TouchableOpacity>
          </View>

          {/* Selector de Opción */}
          <View style={styles.optionsContainer}>
            {/* Opción 1: No se presentó */}
            <TouchableOpacity
              style={[
                styles.optionCard,
                selectedAction === 'NO_SHOW' && styles.optionCardActive,
              ]}
              onPress={() => setSelectedAction('NO_SHOW')}
              activeOpacity={0.8}
            >
              <View style={styles.optionHeader}>
                <View style={styles.radioCircle}>
                  {selectedAction === 'NO_SHOW' && <View style={styles.radioInner} />}
                </View>
                <Text style={styles.optionTitle}>La otra persona no se presentó</Text>
              </View>
              <Text style={styles.optionDesc}>
                Aplica un strike a la reputación de la contraparte tras expirar el tiempo acordado.
              </Text>
            </TouchableOpacity>

            {/* Opción 2: Cancelar / No conforme */}
            <TouchableOpacity
              style={[
                styles.optionCard,
                selectedAction === 'CANCELLED' && styles.optionCardActive,
              ]}
              onPress={() => setSelectedAction('CANCELLED')}
              activeOpacity={0.8}
            >
              <View style={styles.optionHeader}>
                <View style={styles.radioCircle}>
                  {selectedAction === 'CANCELLED' && <View style={styles.radioInner} />}
                </View>
                <Text style={styles.optionTitle}>Cancelar / No conforme con el producto</Text>
              </View>
              <Text style={styles.optionDesc}>
                Para producto dañado, discrepancia en la descripción o acuerdo de no concretar la compra. Sin impacto económico.
              </Text>
            </TouchableOpacity>
          </View>

          {/* Campo de Motivo */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>
              {selectedAction === 'NO_SHOW'
                ? 'Comentarios adicionales (opcional):'
                : 'Motivo de la cancelación (requerido):'}
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder={
                selectedAction === 'NO_SHOW'
                  ? 'Ej. Esperé 20 minutos en el lugar acordado y no respondió...'
                  : 'Ej. El producto tiene un rayón visible no publicado en las fotos...'
              }
              placeholderTextColor="#9CA3AF"
              value={reason}
              onChangeText={setReason}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Botón de Confirmación */}
          <TouchableOpacity
            style={[
              styles.submitBtn,
              selectedAction === 'NO_SHOW' ? styles.submitBtnDanger : styles.submitBtnWarning,
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitBtnText}>
                {selectedAction === 'NO_SHOW'
                  ? 'Confirmar inasistencia (NO_SHOW)'
                  : 'Confirmar cancelación (CANCELLED)'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 36,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
  optionsContainer: {
    gap: 12,
    marginVertical: 10,
  },
  optionCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  optionCardActive: {
    borderColor: PRIMARY_TEAL,
    backgroundColor: '#F0FDFA',
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: PRIMARY_TEAL,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: PRIMARY_TEAL,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_DARK,
    flex: 1,
  },
  optionDesc: {
    fontSize: 12,
    color: MUTED_GRAY,
    lineHeight: 16,
    paddingLeft: 30,
  },
  inputSection: {
    marginTop: 14,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_DARK,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 14,
    padding: 12,
    fontSize: 14,
    color: TEXT_DARK,
    minHeight: 80,
  },
  submitBtn: {
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDanger: {
    backgroundColor: DANGER_RED,
  },
  submitBtnWarning: {
    backgroundColor: '#4B5563',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
