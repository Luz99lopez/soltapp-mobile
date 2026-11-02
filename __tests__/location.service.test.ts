import { Platform } from 'react-native';
import * as Location from 'expo-location';
import { DEFAULT_COORDINATES, locationService } from '../src/services/locationService';

// Estas pruebas importan el código REAL de src/services/locationService.ts.
// Lo único simulado es expo-location (el sensor GPS) y fetch (OpenStreetMap),
// así que corren sin celular y sin internet. Casos GPS-xx de la matriz.

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  geocodeAsync: jest.fn(),
  reverseGeocodeAsync: jest.fn(),
  PermissionStatus: { GRANTED: 'granted', DENIED: 'denied', UNDETERMINED: 'undetermined' },
  Accuracy: { Balanced: 3 },
}));

const pedirPermiso = Location.requestForegroundPermissionsAsync as jest.Mock;
const leerPosicion = Location.getCurrentPositionAsync as jest.Mock;
const geocodificar = Location.geocodeAsync as jest.Mock;
const geocodificarInverso = Location.reverseGeocodeAsync as jest.Mock;
const fetchSimulado = jest.fn();

// Respuesta de OpenStreetMap simulada
const respuestaOSM = (datos: any, ok = true) => ({ ok, json: async () => datos });

beforeEach(() => {
  jest.resetAllMocks();
  jest.useFakeTimers();
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  (global as any).fetch = fetchSimulado;
  (Platform as any).OS = 'ios';
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('Posición GPS actual (GPS-01, GPS-02, GPS-03, GPS-08)', () => {
  it('GPS-01: pide el permiso de ubicación en primer plano una sola vez', async () => {
    pedirPermiso.mockResolvedValue({ status: 'granted' });
    leerPosicion.mockResolvedValue({ coords: { latitude: -34.45, longitude: -58.91 } });
    await locationService.getCurrentLocation();
    expect(pedirPermiso).toHaveBeenCalledTimes(1);
  });

  it('GPS-03: con permiso concedido devuelve latitud y longitud y ningún error', async () => {
    pedirPermiso.mockResolvedValue({ status: 'granted' });
    leerPosicion.mockResolvedValue({ coords: { latitude: -34.45, longitude: -58.91, altitude: 12 } });
    const r = await locationService.getCurrentLocation();
    expect(r).toEqual({ coords: { latitude: -34.45, longitude: -58.91 }, error: null });
  });

  it('GPS-03: pide la posición con precisión balanceada', async () => {
    pedirPermiso.mockResolvedValue({ status: 'granted' });
    leerPosicion.mockResolvedValue({ coords: { latitude: 1, longitude: 2 } });
    await locationService.getCurrentLocation();
    expect(leerPosicion).toHaveBeenCalledWith({ accuracy: 3 });
  });

  it('GPS-02: con el permiso denegado devuelve un mensaje y no consulta la posición', async () => {
    pedirPermiso.mockResolvedValue({ status: 'denied' });
    const r = await locationService.getCurrentLocation();
    expect(r.coords).toBeNull();
    expect(r.error).toBe('Permiso de ubicación denegado. Puedes ingresar una dirección o mover el pin en el mapa.');
    expect(leerPosicion).not.toHaveBeenCalled();
  });

  it('GPS-02: un permiso sin responder (undetermined) también se trata como denegado', async () => {
    pedirPermiso.mockResolvedValue({ status: 'undetermined' });
    const r = await locationService.getCurrentLocation();
    expect(r.coords).toBeNull();
  });

  it('GPS-08: si el GPS falla o está desactivado, informa el error y no se cierra', async () => {
    pedirPermiso.mockResolvedValue({ status: 'granted' });
    leerPosicion.mockRejectedValue(new Error('Location services are disabled'));
    const r = await locationService.getCurrentLocation();
    expect(r.coords).toBeNull();
    expect(r.error).toBe('No se pudo obtener la posición GPS. Verifica que esté habilitado en tu dispositivo.');
  });

  it('GPS-08: si falla la petición del permiso, también informa el error', async () => {
    pedirPermiso.mockRejectedValue(new Error('fallo'));
    const r = await locationService.getCurrentLocation();
    expect(r.coords).toBeNull();
    expect(r.error).toBe('No se pudo obtener la posición GPS. Verifica que esté habilitado en tu dispositivo.');
  });
});

describe('Dirección a coordenadas (GPS-09 a GPS-13)', () => {
  it.each(['', '   ', 'ab', ' a '])('GPS-09: el texto "%s" es muy corto y devuelve null sin buscar', async (texto) => {
    const r = await locationService.geocodeAddress(texto);
    expect(r).toBeNull();
    expect(geocodificar).not.toHaveBeenCalled();
    expect(fetchSimulado).not.toHaveBeenCalled();
  });

  it('GPS-10: en el celular usa el geocodificador nativo y toma el primer resultado', async () => {
    geocodificar.mockResolvedValue([{ latitude: -34.4, longitude: -58.9 }, { latitude: 1, longitude: 2 }]);
    const r = await locationService.geocodeAddress('Pilar');
    expect(r).toEqual({ latitude: -34.4, longitude: -58.9 });
    expect(fetchSimulado).not.toHaveBeenCalled();
  });

  it('GPS-11: si el geocodificador nativo falla, busca en OpenStreetMap', async () => {
    geocodificar.mockRejectedValue(new Error('sin servicio'));
    fetchSimulado.mockResolvedValue(respuestaOSM([{ lat: '-34.5', lon: '-58.8', display_name: 'Pilar, Buenos Aires' }]));
    const r = await locationService.geocodeAddress('Pilar');
    expect(r).toEqual({ latitude: -34.5, longitude: -58.8, displayName: 'Pilar, Buenos Aires' });
  });

  it('GPS-11: si el nativo no encuentra nada, también busca en OpenStreetMap', async () => {
    geocodificar.mockResolvedValue([]);
    fetchSimulado.mockResolvedValue(respuestaOSM([{ lat: '10', lon: '20' }]));
    const r = await locationService.geocodeAddress('Calle inventada 123');
    expect(r?.latitude).toBe(10);
  });

  it('GPS-12: en la web usa solo OpenStreetMap y codifica el texto en la dirección', async () => {
    (Platform as any).OS = 'web';
    fetchSimulado.mockResolvedValue(respuestaOSM([{ lat: '1', lon: '2' }]));
    await locationService.geocodeAddress('Av. Libertador 100');
    expect(geocodificar).not.toHaveBeenCalled();
    const url = fetchSimulado.mock.calls[0][0] as string;
    expect(url).toBe('https://nominatim.openstreetmap.org/search?q=Av.%20Libertador%20100&format=json&limit=1');
  });

  it('GPS-13: OpenStreetMap sin resultados devuelve null', async () => {
    (Platform as any).OS = 'web';
    fetchSimulado.mockResolvedValue(respuestaOSM([]));
    expect(await locationService.geocodeAddress('zzzzzz')).toBeNull();
  });

  it('GPS-13: OpenStreetMap con error HTTP devuelve null', async () => {
    (Platform as any).OS = 'web';
    fetchSimulado.mockResolvedValue(respuestaOSM([], false));
    expect(await locationService.geocodeAddress('Pilar')).toBeNull();
  });

  it('GPS-13: si falla la conexión devuelve null y no rompe la app', async () => {
    (Platform as any).OS = 'web';
    fetchSimulado.mockRejectedValue(new Error('sin internet'));
    expect(await locationService.geocodeAddress('Pilar')).toBeNull();
  });

  it('GPS-13: una coordenada que no es un número devuelve null', async () => {
    (Platform as any).OS = 'web';
    fetchSimulado.mockResolvedValue(respuestaOSM([{ lat: 'abc', lon: '2' }]));
    expect(await locationService.geocodeAddress('Pilar')).toBeNull();
  });
});

describe('Coordenadas a dirección (GPS-14 a GPS-16)', () => {
  it.each([null, undefined, { latitude: 'a', longitude: 2 }, { latitude: 1 }])(
    'GPS-14: las coordenadas inválidas devuelven null',
    async (coords) => {
      expect(await locationService.reverseGeocodeCoords(coords as any)).toBeNull();
    }
  );

  it('GPS-15: con código postal y ciudad devuelve "1629, Pilar"', async () => {
    geocodificarInverso.mockResolvedValue([{ postalCode: '1629', city: 'Pilar' }]);
    expect(await locationService.reverseGeocodeCoords({ latitude: -34.4, longitude: -58.9 })).toBe('1629, Pilar');
  });

  it('GPS-15: sin ciudad usa el partido (subregion) y, si no, el distrito o la región', async () => {
    geocodificarInverso.mockResolvedValue([{ subregion: 'Partido de Pilar' }]);
    expect(await locationService.reverseGeocodeCoords({ latitude: 1, longitude: 2 })).toBe('Partido de Pilar');
  });

  it('GPS-15: con solo código postal devuelve el código', async () => {
    geocodificarInverso.mockResolvedValue([{ postalCode: '1629' }]);
    expect(await locationService.reverseGeocodeCoords({ latitude: 1, longitude: 2 })).toBe('1629');
  });

  it('GPS-16: si el nativo no sirve, usa OpenStreetMap con código postal y localidad', async () => {
    geocodificarInverso.mockResolvedValue([]);
    fetchSimulado.mockResolvedValue(respuestaOSM({ address: { postcode: '1629', town: 'Pilar' } }));
    expect(await locationService.reverseGeocodeCoords({ latitude: 1, longitude: 2 })).toBe('1629, Pilar');
  });

  it('GPS-16: en la web arma la dirección de consulta con latitud y longitud', async () => {
    (Platform as any).OS = 'web';
    fetchSimulado.mockResolvedValue(respuestaOSM({ address: { city: 'Pilar' } }));
    await locationService.reverseGeocodeCoords({ latitude: -34.4, longitude: -58.9 });
    expect(fetchSimulado.mock.calls[0][0]).toBe(
      'https://nominatim.openstreetmap.org/reverse?lat=-34.4&lon=-58.9&format=json'
    );
  });

  it('GPS-16: sin datos de dirección usa los dos primeros tramos del nombre completo', async () => {
    (Platform as any).OS = 'web';
    fetchSimulado.mockResolvedValue(respuestaOSM({ address: {}, display_name: 'Pilar, Buenos Aires, Argentina' }));
    // address vacío es verdadero: el servicio cae en display_name solo si no hay postcode ni localidad
    expect(await locationService.reverseGeocodeCoords({ latitude: 1, longitude: 2 })).toBe('Pilar, Buenos Aires');
  });

  it('GPS-16: si OpenStreetMap falla devuelve null', async () => {
    (Platform as any).OS = 'web';
    fetchSimulado.mockRejectedValue(new Error('sin internet'));
    expect(await locationService.reverseGeocodeCoords({ latitude: 1, longitude: 2 })).toBeNull();
  });
});

describe('Ubicación por defecto (GPS-17)', () => {
  it('GPS-17: las coordenadas por defecto son las de Pilar', () => {
    expect(DEFAULT_COORDINATES).toEqual({ latitude: -34.458626, longitude: -58.914207 });
  });
});