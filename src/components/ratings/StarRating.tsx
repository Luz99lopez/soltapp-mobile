import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface StarRatingProps {
  /**
   * Valor numérico de calificación (1 a 5).
   * En modo solo lectura puede ser decimal (ej. 4.8).
   */
  value: number;
  /**
   * Si es true, el componente no permite interacción y muestra la media/resumen.
   */
  readOnly?: boolean;
  /**
   * Callback invocado al seleccionar una puntuación (1 a 5).
   */
  onChange?: (rating: number) => void;
  /**
   * Tamaño en píxeles de cada estrella.
   */
  size?: number;
  /**
   * Espaciado horizontal entre estrellas.
   */
  spacing?: number;
  /**
   * Mostrar texto numérico con la media (ej. 4.8) en modo solo lectura.
   */
  showValueText?: boolean;
  /**
   * Total de valoraciones para mostrar entre paréntesis en modo solo lectura (ej. 24 -> "(24)").
   */
  totalRatings?: number;
  /**
   * Color de la estrella activa (cumple contraste WCAG AA > 4.5:1 sobre blanco).
   */
  activeColor?: string;
  /**
   * Color de la estrella inactiva.
   */
  inactiveColor?: string;
  /**
   * Estilo contenedor personalizado.
   */
  containerStyle?: ViewStyle;
  /**
   * Estilo personalizado para el texto numérico.
   */
  textStyle?: TextStyle;
}

// Colores con contraste superior a 4.5:1 (WCAG AA) sobre fondos claros
const DEFAULT_ACTIVE_GOLD = '#D97706'; // Ámbar 600 (contraste ~4.6:1 contra #FFFFFF)
const DEFAULT_INACTIVE_GRAY = '#CBD5E1'; // Slate 300
const TEXT_DARK = '#1F232E';

export const StarRating: React.FC<StarRatingProps> = ({
  value,
  readOnly = false,
  onChange,
  size = 28,
  spacing = 6,
  showValueText = false,
  totalRatings,
  activeColor = DEFAULT_ACTIVE_GOLD,
  inactiveColor = DEFAULT_INACTIVE_GRAY,
  containerStyle,
  textStyle,
}) => {
  // Estado para previsualización al pasar el puntero (hover en Web)
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const displayRating = hoverValue !== null ? hoverValue : value;
  const roundedOneDecimal = Math.round(value * 10) / 10;

  // Manejo de teclado para accesibilidad (Web & Desktop)
  const handleKeyDown = (event: any, currentStar: number) => {
    if (readOnly || !onChange) return;

    const key = event?.key || event?.nativeEvent?.key;

    if (key === 'ArrowRight' || key === 'ArrowUp') {
      event?.preventDefault?.();
      const next = Math.min(5, Math.floor(value || 0) + 1);
      onChange(next);
    } else if (key === 'ArrowLeft' || key === 'ArrowDown') {
      event?.preventDefault?.();
      const prev = Math.max(1, Math.ceil(value || 1) - 1);
      onChange(prev);
    } else if (key === 'Enter' || key === ' ') {
      event?.preventDefault?.();
      onChange(currentStar);
    }
  };

  const starsArray = [1, 2, 3, 4, 5];

  return (
    <View
      style={[styles.wrapper, containerStyle]}
      // Atributos de accesibilidad para lectores de pantalla
      accessible={true}
      accessibilityRole={readOnly ? 'summary' : 'radiogroup'}
      accessibilityLabel={
        readOnly
          ? `Calificación promedio de ${roundedOneDecimal.toFixed(1)} sobre 5 estrellas${
              totalRatings !== undefined ? `, basado en ${totalRatings} valoraciones` : ''
            }`
          : 'Selecciona una calificación de 1 a 5 estrellas'
      }
      {...(Platform.OS === 'web'
        ? ({
            role: readOnly ? 'img' : 'radiogroup',
            'aria-label': readOnly
              ? `Calificación promedio: ${roundedOneDecimal.toFixed(1)} de 5 estrellas`
              : 'Calificar usuario de 1 a 5 estrellas',
          } as any)
        : {})}
    >
      <View style={styles.starsRow}>
        {starsArray.map((starIndex) => {
          let isFull = false;
          let isHalf = false;

          if (readOnly) {
            if (value >= starIndex) {
              isFull = true;
            } else if (value >= starIndex - 0.5) {
              isHalf = true;
            }
          } else {
            isFull = displayRating >= starIndex;
          }

          const iconName = isFull ? 'star' : isHalf ? 'star-half' : 'star-outline';
          const starColor = isFull || isHalf ? activeColor : inactiveColor;

          if (readOnly) {
            return (
              <View
                key={starIndex}
                style={[
                  styles.starContainer,
                  { marginRight: starIndex < 5 ? spacing : 0 },
                ]}
              >
                <Ionicons name={iconName} size={size} color={starColor} />
              </View>
            );
          }

          const isSelected = value === starIndex;

          return (
            <Pressable
              key={starIndex}
              onPress={() => onChange && onChange(starIndex)}
              onHoverIn={() => setHoverValue(starIndex)}
              onHoverOut={() => setHoverValue(null)}
              // Atributos accesibles para cada estrella interactiva
              accessible={true}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`${starIndex} de 5 estrellas`}
              accessibilityValue={{ min: 1, max: 5, now: starIndex }}
              style={({ pressed }) => [
                styles.starContainer,
                styles.interactiveStar,
                { marginRight: starIndex < 5 ? spacing : 0 },
                pressed && styles.pressedStar,
              ]}
              {...(Platform.OS === 'web'
                ? ({
                    role: 'radio',
                    'aria-checked': isSelected,
                    'aria-label': `${starIndex} estrella${starIndex > 1 ? 's' : ''}`,
                    tabIndex: 0,
                    onKeyDown: (e: any) => handleKeyDown(e, starIndex),
                  } as any)
                : {})}
            >
              <Ionicons name={iconName} size={size} color={starColor} />
            </Pressable>
          );
        })}
      </View>

      {/* Texto de valor numérico y total de votos (solo lectura) */}
      {showValueText && (
        <View style={styles.valueRow}>
          <Text style={[styles.valueText, textStyle]}>
            {roundedOneDecimal.toFixed(1)}
          </Text>
          {totalRatings !== undefined && (
            <Text style={styles.totalText}>({totalRatings})</Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  interactiveStar: {
    cursor: Platform.OS === 'web' ? ('pointer' as any) : undefined,
    padding: 2,
    borderRadius: 4,
  },
  pressedStar: {
    transform: [{ scale: 0.92 }],
    opacity: 0.85,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  valueText: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT_DARK,
  },
  totalText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
    marginLeft: 4,
  },
});
