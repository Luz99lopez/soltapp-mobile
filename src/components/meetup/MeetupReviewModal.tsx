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

interface MeetupReviewModalProps {
  visible: boolean;
  order: MeetupOrder;
  isSeller: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PRIMARY_TEAL = '#3BD7C2';
const TEXT_DARK = '#1F232E';
const MUTED_GRAY = '#6C757D';
const STAR_GOLD = '#FBBF24';

export const MeetupReviewModal: React.FC<MeetupReviewModalProps> = ({
  visible,
  order,
  isSeller,
  onClose,
  onSuccess,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const counterpartName = isSeller
    ? order.buyer?.full_name || 'Comprador'
    : order.seller?.full_name || 'Vendedor';

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      await meetupOrderService.submitOrderReview(order.id, rating, comment.trim() || undefined);
      Alert.alert(
        '¡Gracias por tu valoración!',
        'Tu calificación ayuda a mantener a Soltapp como una comunidad confiable y segura.',
        [{ text: 'Finalizar', onPress: onSuccess }]
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo registrar la calificación.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.iconCircle}>
            <Ionicons name="star" size={32} color={STAR_GOLD} />
          </View>

          <Text style={styles.title}>¿Cómo fue tu experiencia?</Text>
          <Text style={styles.subtitle}>
            Califica a <Text style={{ fontWeight: '700', color: TEXT_DARK }}>{counterpartName}</Text> para fortalecer su reputación en Soltapp.
          </Text>

          {/* Star selector */}
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((starIndex) => (
              <TouchableOpacity
                key={starIndex}
                onPress={() => setRating(starIndex)}
                activeOpacity={0.7}
                style={styles.starBtn}
              >
                <Ionicons
                  name={starIndex <= rating ? 'star' : 'star-outline'}
                  size={36}
                  color={starIndex <= rating ? STAR_GOLD : '#D1D5DB'}
                />
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.ratingDescriptor}>
            {rating === 5 && '🌟 Excelente encuentro'}
            {rating === 4 && '👍 Muy buena experiencia'}
            {rating === 3 && '👌 Aceptable / Todo correcto'}
            {rating === 2 && '👎 Pudo ser mejor'}
            {rating === 1 && '⚠️ Mala experiencia'}
          </Text>

          {/* Comment text area */}
          <TextInput
            style={styles.input}
            placeholder="Deja un comentario sobre la puntualidad, trato o producto..."
            placeholderTextColor="#9CA3AF"
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          {/* Submit button */}
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitBtnText}>Enviar Calificación</Text>
            )}
          </TouchableOpacity>

          {/* Skip button */}
          <TouchableOpacity style={styles.skipBtn} onPress={onClose}>
            <Text style={styles.skipBtnText}>Omitir por ahora</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: TEXT_DARK,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: MUTED_GRAY,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 18,
  },
  starBtn: {
    paddingHorizontal: 6,
  },
  ratingDescriptor: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0D9488',
    marginBottom: 14,
  },
  input: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 12,
    fontSize: 13,
    color: TEXT_DARK,
    minHeight: 70,
    marginBottom: 18,
  },
  submitBtn: {
    width: '100%',
    backgroundColor: PRIMARY_TEAL,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  skipBtn: {
    marginTop: 12,
    paddingVertical: 6,
  },
  skipBtnText: {
    color: MUTED_GRAY,
    fontSize: 13,
  },
});
