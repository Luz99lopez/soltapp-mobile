import { Platform } from 'react-native';
import * as Location from 'expo-location';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  displayName?: string;
}

export const DEFAULT_COORDINATES: LocationCoordinates = {
  latitude: -34.458626,
  longitude: -58.914207,
};

/**
 * Servicio de Geolocalización y Geocodificación para Soltapp
 * Compatible con iOS, Android y Web
 */
export const locationService = {
  /**
   * Solicita permisos y obtiene la posición GPS actual del usuario
   */
  async getCurrentLocation(): Promise<{ coords: LocationCoordinates | null; error: string | null }> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== Location.PermissionStatus.GRANTED) {
        return {
          coords: null,
          error: 'Permiso de ubicación denegado. Puedes ingresar una dirección o mover el pin en el mapa.',
        };
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      return {
        coords: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        },
        error: null,
      };
    } catch (err: any) {
      console.warn('[locationService.getCurrentLocation] Error:', err);
      return {
        coords: null,
        error: 'No se pudo obtener la posición GPS. Verifica que esté habilitado en tu dispositivo.',
      };
    }
  },

  /**
   * Geocodificación directa: Convierte una dirección/texto ingresado en coordenadas (lat/lng)
   */
  async geocodeAddress(address: string): Promise<GeocodeResult | null> {
    const query = address ? address.trim() : '';
    if (!query || query.length < 3) {
      return null;
    }

    // 1. En entornos nativos (iOS / Android), intentar primero con expo-location nativo
    if (Platform.OS !== 'web') {
      try {
        const results = await Location.geocodeAsync(query);
        if (results && results.length > 0) {
          const first = results[0];
          if (typeof first.latitude === 'number' && typeof first.longitude === 'number') {
            return {
              latitude: first.latitude,
              longitude: first.longitude,
            };
          }
        }
      } catch (nativeErr) {
        console.warn('[locationService.geocodeAddress] Error nativo expo-location, recurriendo a OSM:', nativeErr);
      }
    }

    // 2. Fallback / Entorno Web: OpenStreetMap Nominatim
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'SoltappMobileApp/1.0 (contact: info@soltapp.com)',
          'Accept-Language': 'es,en',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        const item = data[0];
        const lat = parseFloat(item.lat);
        const lon = parseFloat(item.lon);
        if (!isNaN(lat) && !isNaN(lon)) {
          return {
            latitude: lat,
            longitude: lon,
            displayName: item.display_name,
          };
        }
      }
    } catch (osmErr) {
      console.warn('[locationService.geocodeAddress] Error en búsqueda OSM:', osmErr);
    }

    return null;
  },

  /**
   * Geocodificación inversa: Convierte coordenadas (lat/lng) a texto legible ("1629, Pilar")
   */
  async reverseGeocodeCoords(coords: LocationCoordinates): Promise<string | null> {
    if (!coords || typeof coords.latitude !== 'number' || typeof coords.longitude !== 'number') {
      return null;
    }

    // 1. En entornos nativos (iOS / Android), intentar primero con expo-location nativo
    if (Platform.OS !== 'web') {
      try {
        const results = await Location.reverseGeocodeAsync({
          latitude: coords.latitude,
          longitude: coords.longitude,
        });

        if (results && results.length > 0) {
          const place = results[0];
          const postalCode = place.postalCode ? place.postalCode.trim() : '';
          const cityOrLocality =
            place.city ||
            place.subregion ||
            place.district ||
            place.region ||
            '';

          if (postalCode && cityOrLocality) {
            return `${postalCode}, ${cityOrLocality}`;
          } else if (cityOrLocality) {
            return cityOrLocality;
          } else if (postalCode) {
            return postalCode;
          }
        }
      } catch (nativeErr) {
        console.warn('[locationService.reverseGeocodeCoords] Error nativo expo-location, recurriendo a OSM:', nativeErr);
      }
    }

    // 2. Fallback / Entorno Web: OpenStreetMap Nominatim Reverse
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const url = `https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'SoltappMobileApp/1.0 (contact: info@soltapp.com)',
          'Accept-Language': 'es,en',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const addr = data?.address;
      if (addr) {
        const postcode = addr.postcode ? addr.postcode.trim() : '';
        const cityOrTown =
          addr.town ||
          addr.city ||
          addr.village ||
          addr.suburb ||
          addr.municipality ||
          addr.state_district ||
          addr.state ||
          '';

        if (postcode && cityOrTown) {
          return `${postcode}, ${cityOrTown}`;
        } else if (cityOrTown) {
          return cityOrTown;
        } else if (postcode) {
          return postcode;
        } else if (data.display_name) {
          const parts = data.display_name.split(',');
          return parts.slice(0, 2).join(',').trim();
        }
      }
    } catch (osmErr) {
      console.warn('[locationService.reverseGeocodeCoords] Error en reversa OSM:', osmErr);
    }

    return null;
  },
};
