import React, { useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface InteractiveLocationMapProps {
  coordinates: LocationCoordinates;
  onCoordinatesChange: (coords: LocationCoordinates) => void;
  loading?: boolean;
  loadingText?: string;
  onRequestGPS?: () => void;
  height?: number;
  borderRadius?: number;
}

// Pilar, Buenos Aires por defecto
export const DEFAULT_COORDINATES: LocationCoordinates = {
  latitude: -34.458626,
  longitude: -58.914207,
};

export const DEFAULT_DELTA = {
  latitudeDelta: 0.015,
  longitudeDelta: 0.015,
};

const SOLTAPP_TEAL = '#3BD7C2';
const SOLTAPP_DARK_TEAL = '#0D9488';

/**
 * Marcador visual estilizado con la identidad de marca de Soltapp
 */
export function SoltappPin({ isDragging = false }: { isDragging?: boolean }) {
  return (
    <View style={styles.pinWrapper}>
      {/* Burbuja superior con borde blanco y sombra */}
      <View style={[styles.pinBubble, isDragging && styles.pinBubbleActive]}>
        <View style={styles.pinInnerCircle}>
          <Ionicons name="location-sharp" size={15} color={SOLTAPP_DARK_TEAL} />
        </View>
      </View>
      {/* Punta triangular inferior */}
      <View style={styles.pinTip} />
      {/* Sombra de apoyo en el suelo */}
      <View style={styles.pinGroundShadow} />
    </View>
  );
}

export default function InteractiveLocationMap({
  coordinates,
  onCoordinatesChange,
  loading = false,
  loadingText = 'Obteniendo ubicación...',
  onRequestGPS,
  height = 195,
  borderRadius = 16,
}: InteractiveLocationMapProps) {
  // Manejo condicional para plataforma Nativa (iOS / Android) vs Web
  if (Platform.OS === 'web') {
    // Renderizado en Web: OpenStreetMap puro SIN parámetro &marker= para evitar duplicación
    const deltaLon = 0.01;
    const deltaLat = 0.007;
    const minLon = coordinates.longitude - deltaLon;
    const maxLon = coordinates.longitude + deltaLon;
    const minLat = coordinates.latitude - deltaLat;
    const maxLat = coordinates.latitude + deltaLat;
    const bbox = `${minLon}%2C${minLat}%2C${maxLon}%2C${maxLat}`;

    // Nota: Omitimos &marker= para que OpenStreetMap NO pinte su propio marcador nativo
    const iframeUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik`;

    return (
      <View style={[styles.container, { height, borderRadius }]}>
        <iframe
          src={iframeUrl}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            borderRadius,
          }}
          title="Ubicación de tus productos"
        />

        {/* ÚNICO Marcador central superpuesto con diseño oficial Soltapp */}
        <View style={styles.webPinOverlay} pointerEvents="none">
          <SoltappPin />
        </View>

        {/* Badge superior: Identidad Soltapp */}
        <View style={styles.mapBadge}>
          <View style={styles.mapBadgeDot} />
          <Text style={styles.mapBadgeText}>Ubicación de tus productos</Text>
        </View>

        {/* Chip inferior con coordenadas */}
        <View style={styles.coordChip}>
          <Ionicons name="navigate-circle" size={13} color={SOLTAPP_DARK_TEAL} />
          <Text style={styles.coordChipText}>
            {coordinates.latitude.toFixed(4)}, {coordinates.longitude.toFixed(4)}
          </Text>
        </View>

        {/* Botón flotante para GPS */}
        {onRequestGPS && (
          <TouchableOpacity
            style={styles.gpsButton}
            onPress={onRequestGPS}
            activeOpacity={0.8}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={SOLTAPP_DARK_TEAL} />
            ) : (
              <Ionicons name="locate" size={18} color={SOLTAPP_DARK_TEAL} />
            )}
          </TouchableOpacity>
        )}

        {/* Indicador de carga estilizado */}
        {loading && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingCard}>
              <ActivityIndicator size="small" color={SOLTAPP_DARK_TEAL} />
              <Text style={styles.loadingText}>{loadingText}</Text>
            </View>
          </View>
        )}
      </View>
    );
  }

  // Renderizado Nativo (iOS / Android) con react-native-maps
  const MapView = require('react-native-maps').default;
  const { Marker } = require('react-native-maps');

  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (mapRef.current && coordinates.latitude && coordinates.longitude) {
      mapRef.current.animateToRegion(
        {
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          ...DEFAULT_DELTA,
        },
        500
      );
    }
  }, [coordinates.latitude, coordinates.longitude]);

  const handleDragEnd = (e: any) => {
    const newCoords = e.nativeEvent?.coordinate;
    if (newCoords && typeof newCoords.latitude === 'number' && typeof newCoords.longitude === 'number') {
      onCoordinatesChange({
        latitude: newCoords.latitude,
        longitude: newCoords.longitude,
      });
    }
  };

  return (
    <View style={[styles.container, { height, borderRadius }]}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={{
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          ...DEFAULT_DELTA,
        }}
        showsUserLocation={false}
        showsMyLocationButton={false}
        loadingEnabled={true}
      >
        <Marker
          draggable
          anchor={{ x: 0.5, y: 0.95 }}
          coordinate={{
            latitude: coordinates.latitude,
            longitude: coordinates.longitude,
          }}
          onDragEnd={handleDragEnd}
          title="Ubicación de tus productos"
          description="Arrastra el marcador para ajustar la posición"
        >
          <SoltappPin />
        </Marker>
      </MapView>

      {/* Badge superior: Identidad Soltapp */}
      <View style={styles.mapBadge}>
        <View style={styles.mapBadgeDot} />
        <Text style={styles.mapBadgeText}>Ubicación de tus productos</Text>
      </View>

      {/* Chip inferior con coordenadas */}
      <View style={styles.coordChip}>
        <Ionicons name="navigate-circle" size={13} color={SOLTAPP_DARK_TEAL} />
        <Text style={styles.coordChipText}>
          {coordinates.latitude.toFixed(4)}, {coordinates.longitude.toFixed(4)}
        </Text>
      </View>

      {/* Botón flotante para GPS / Ubicación actual */}
      {onRequestGPS && (
        <TouchableOpacity
          style={styles.gpsButton}
          onPress={onRequestGPS}
          activeOpacity={0.8}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={SOLTAPP_DARK_TEAL} />
          ) : (
            <Ionicons name="locate" size={18} color={SOLTAPP_DARK_TEAL} />
          )}
        </TouchableOpacity>
      )}

      {/* Indicador de carga estilizado */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="small" color={SOLTAPP_DARK_TEAL} />
            <Text style={styles.loadingText}>{loadingText}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
    position: 'relative',
    marginTop: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  // Pin Soltapp
  pinWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: SOLTAPP_TEAL,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 6,
  },
  pinBubbleActive: {
    transform: [{ scale: 1.15 }],
    backgroundColor: SOLTAPP_DARK_TEAL,
  },
  pinInnerCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinTip: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: SOLTAPP_TEAL,
    marginTop: -2,
  },
  pinGroundShadow: {
    width: 14,
    height: 4,
    borderRadius: 7,
    backgroundColor: 'rgba(15, 23, 42, 0.22)',
    marginTop: 2,
  },
  webPinOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -18 }, { translateY: -42 }],
    zIndex: 10,
  },
  // Badge superior Soltapp
  mapBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.9)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 15,
    gap: 6,
  },
  mapBadgeDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: SOLTAPP_TEAL,
  },
  mapBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1F232E',
  },
  // Chip inferior de coordenadas
  coordChip: {
    position: 'absolute',
    bottom: 8,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
    zIndex: 15,
    gap: 4,
  },
  coordChipText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#475569',
  },
  // Botón flotante GPS
  gpsButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FFFFFF',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 20,
    borderWidth: 1.5,
    borderColor: '#CCFBF1',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 30,
  },
  loadingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#CCFBF1',
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    fontWeight: '700',
    color: SOLTAPP_DARK_TEAL,
  },
});
