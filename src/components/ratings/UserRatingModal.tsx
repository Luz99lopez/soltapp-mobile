import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StarRating } from './StarRating';
import { ratingService } from '../../services/ratingService';
import { isRateLimited } from '../../utils/ratingCalculations';
import { UserRating } from '../../types/rating.types';

export interface UserRatingModalProps {
  visible: boolean;
  targetUserId: string;
  targetUserName?: string;
  existingRating?: UserRating | null;
  onClose: () => void;
  onSuccess: () => void;
}

const PRIMARY_TEAL = '#3BD7C2';
const TEXT_DARK = '#1F232E';
const MUTED_GRAY = '#64748B';
const STAR_GOLD = '#D97706';
const MAX_COMMENT_LENGTH = 500;

export const UserRatingModal: React.FC<UserRatingModalProps> = ({
  visible,
  targetUserId,
  targetUserName = 'este usuario',
  existingRating = null,
  onClose,
  onSuccess,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Inicializar con valores previos si se está editando
  useEffect(() => {
    if (visible) {
      if (existingRating) {
        setRating(existingRating.rating);
        setComment(existingRating.comment || '');
      } else {
        setRating(5);
        setComment('');
      }
      setErrorMessage(null);
    }
  }, [visible, existingRating]);

  const remainingChars = MAX_COMMENT_LENGTH - comment.length;
  const isOverLimit = remainingChars < 0;

  const handleSubmit = async () => {
    if (rating < 1 || rating > 5) {
      setErrorMessage('Por favor, selecciona entre 1 y 5 estrellas.');
      return;
    }

    if (isOverLimit) {
      setErrorMessage(`El comentario no puede superar los ${MAX_COMMENT_LENGTH} caracteres.`);
      return;
    }

    if (existingRating && isRateLimited(existingRating.updated_at, 30)) {
      setErrorMessage('Has realizado un cambio recientemente. Espera 30 segundos antes de volver a modificar.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const result = await ratingService.upsertRating(
        targetUserId,
        rating,
        comment.trim() || null
      );

      if (result.success) {
        const title = existingRating ? '¡Valoración actualizada!' : '¡Gracias por tu valoración!';
        const message = 'Tu reseña ayuda a fortalecer la confianza en la comunidad de Soltapp.';

        if (Platform.OS === 'web') {
          alert(`${title}\n${message}`);
          onSuccess();
          onClose();
        } else {
          Alert.alert(title, message, [
            {
              text: 'Aceptar',
              onPress: () => {
                onSuccess();
                onClose();
              },
            },
          ]);
        }
      } else {
        setErrorMessage(result.error || 'No se pudo guardar la calificación.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Ocurrió un error inesperado al enviar la valoración.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDescriptor = (val: number) => {
    switch (val) {
      case 5:
        return '🌟 Excelente experiencia';
      case 4:
        return '👍 Muy buena experiencia';
      case 3:
        return '👌 Aceptable / Todo correcto';
      case 2:
        return '👎 Pudo ser mejor';
      case 1:
        return '⚠️ Mala experiencia';
      default:
        return '';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.card}>
          <ScrollView
            bounces={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Botón cerrar esquina superior */}
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityLabel="Cerrar ventana de valoración"
              accessibilityRole="button"
            >
              <Ionicons name="close" size={24} color={MUTED_GRAY} />
            </TouchableOpacity>

            {/* Ícono superior */}
            <View style={styles.iconCircle}>
              <Ionicons name="star" size={32} color={STAR_GOLD} />
            </View>

            {/* Títulos */}
            <Text style={styles.title}>
              {existingRating ? 'Modificar tu valoración' : '¿Cómo fue tu experiencia?'}
            </Text>
            <Text style={styles.subtitle}>
              Califica a <Text style={styles.targetNameBold}>{targetUserName}</Text> para
              ayudar a otros usuarios a conocer su reputación.
            </Text>

            {/* Selector de estrellas */}
            <View style={styles.starsWrapper}>
              <StarRating
                value={rating}
                readOnly={false}
                size={40}
                spacing={10}
                onChange={(newVal) => {
                  setRating(newVal);
                  setErrorMessage(null);
                }}
              />
            </View>

            <Text style={styles.ratingDescriptor}>{getDescriptor(rating)}</Text>

            {/* Campo de comentario opcional */}
            <View style={styles.commentSection}>
              <View style={styles.commentHeaderRow}>
                <Text style={styles.commentLabel}>Comentario (opcional)</Text>
                <Text
                  style={[
                    styles.counterText,
                    isOverLimit && styles.counterTextError,
                  ]}
                >
                  {comment.length}/{MAX_COMMENT_LENGTH}
                </Text>
              </View>

              <TextInput
                style={[
                  styles.textArea,
                  isOverLimit && styles.textAreaError,
                ]}
                placeholder="Comparte detalles sobre la puntualidad, comunicación o estado del producto..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={4}
                maxLength={MAX_COMMENT_LENGTH + 50} // Permitir tipear un poco más para ver el aviso de límite
                value={comment}
                onChangeText={(text) => {
                  setComment(text);
                  setErrorMessage(null);
                }}
                accessibilityLabel="Comentario opcional sobre el usuario"
              />
            </View>

            {/* Mensaje de error / advertencia */}
            {errorMessage && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={18} color="#EF4444" style={{ marginRight: 6 }} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            {/* Botones de acción */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={onClose}
                disabled={isSubmitting}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  (isSubmitting || isOverLimit) && styles.submitBtnDisabled,
                ]}
                onPress={handleSubmit}
                disabled={isSubmitting || isOverLimit}
                activeOpacity={0.8}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitBtnText}>
                    {existingRating ? 'Actualizar voto' : 'Publicar valoración'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    position: 'relative',
    maxHeight: '90%',
  },
  scrollContent: {
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: 4,
    zIndex: 10,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#FDE68A',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: TEXT_DARK,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: MUTED_GRAY,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  targetNameBold: {
    fontWeight: '700',
    color: TEXT_DARK,
  },
  starsWrapper: {
    marginVertical: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratingDescriptor: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT_DARK,
    marginTop: 6,
    marginBottom: 20,
  },
  commentSection: {
    width: '100%',
    marginBottom: 16,
  },
  commentHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  commentLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_DARK,
  },
  counterText: {
    fontSize: 12,
    color: MUTED_GRAY,
    fontWeight: '500',
  },
  counterTextError: {
    color: '#EF4444',
    fontWeight: '700',
  },
  textArea: {
    width: '100%',
    minHeight: 90,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 12,
    fontSize: 14,
    color: TEXT_DARK,
    backgroundColor: '#F8FAFC',
    textAlignVertical: 'top',
  },
  textAreaError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  errorBox: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#B91C1C',
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
    marginTop: 6,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#475569',
  },
  submitBtn: {
    flex: 1.5,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: PRIMARY_TEAL,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: PRIMARY_TEAL,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  submitBtnDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
