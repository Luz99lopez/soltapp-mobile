import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { categoryService, locationService, productService, storageService } from '../services';
import { ProductCondition } from '../types/database.types';
import InteractiveLocationMap, { DEFAULT_COORDINATES, LocationCoordinates } from './InteractiveLocationMap';

// Opciones de condición de producto
const CONDITION_OPTIONS: { label: string; value: ProductCondition }[] = [
  { label: 'Nuevo', value: 'nuevo' },
  { label: 'Como nuevo', value: 'como_nuevo' },
  { label: 'Bueno', value: 'bueno' },
  { label: 'Regular', value: 'regular' },
];

// Opciones de peso de envío
const WEIGHT_OPTIONS = [
  '0 a 2 kg',
  '2 a 5 kg',
  '5 a 10 kg',
  '10 a 20 kg',
  '20 a 30 kg',
  '30 a 50 kg',
];

// Categorías por defecto en caso de no haber conexión
const FALLBACK_CATEGORIES = [
  { id: 1, name: 'Autos' },
  { id: 2, name: 'Motos' },
  { id: 3, name: 'Motor y accesorios' },
  { id: 4, name: 'Moda y accesorios' },
  { id: 5, name: 'Inmobiliaria' },
  { id: 6, name: 'Tecnología y electrónica' },
  { id: 7, name: 'Móviles y telefonía' },
  { id: 8, name: 'Informática' },
  { id: 9, name: 'Deporte y ocio' },
  { id: 10, name: 'Bicicletas' },
  { id: 11, name: 'Consolas y videojuegos' },
  { id: 12, name: 'Hogar y jardín' },
  { id: 13, name: 'Electrodomésticos' },
  { id: 14, name: 'Cine, libros y música' },
  { id: 15, name: 'Niños y bebés' },
  { id: 16, name: 'Coleccionismo' },
  { id: 17, name: 'Construcción' },
  { id: 18, name: 'Industria y agricultura' },
  { id: 19, name: 'Otros' },
];

const DEFAULT_PRODUCT_FALLBACK = 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=500&q=80';

interface UploadProductViewProps {
  onProductCreated?: () => void;
  userLocation?: string;
}

export default function UploadProductView({
  onProductCreated,
  userLocation = 'C1629 Pilar',
}: UploadProductViewProps) {
  // Sección 1: Información
  const [quickInfo, setQuickInfo] = useState('');

  // Sección 2: Fotos
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoModalVisible, setPhotoModalVisible] = useState(false);

  // Sección 3: Categoría y Datos Principales
  const [categories, setCategories] = useState<{ id: number; name: string }[]>(FALLBACK_CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState<{ id: number; name: string } | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [condition, setCondition] = useState<ProductCondition>('como_nuevo');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState<'ARS' | 'USD'>('ARS');

  // Sección 4: Envíos
  const [shippingActive, setShippingActive] = useState(true);
  const [selectedWeight, setSelectedWeight] = useState('0 a 2 kg');

  // Sección 5: Localización, Sugerencias tipo Google Maps y GPS
  const [location, setLocation] = useState(userLocation);
  const [coordinates, setCoordinates] = useState<LocationCoordinates>(DEFAULT_COORDINATES);
  const [isLocatingGPS, setIsLocatingGPS] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<{ id: string; name: string; lat: number; lon: number }>>([]);
  const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false);

  // Modales y Estados de UI
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [conditionModalVisible, setConditionModalVisible] = useState(false);
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successModalVisible, setSuccessModalVisible] = useState(false);

  // Cargar categorías de Supabase al montar
  useEffect(() => {
    categoryService
      .getRootCategories()
      .then((data) => {
        if (data && data.length > 0) {
          setCategories(data);
        }
      })
      .catch(() => {});
  }, []);

  // Búsqueda automática de sugerencias tipo Maps a medida que se escribe
  useEffect(() => {
    const trimmed = location.trim();
    if (trimmed.length < 3 || trimmed === 'Mi ubicación actual') {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearchingSuggestions(true);
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(trimmed)}&format=json&limit=5&addressdetails=1`;
        const res = await fetch(url, { headers: { 'Accept-Language': 'es' } });
        if (res.ok) {
          const data = await res.json();
          setSuggestions(
            data.map((item: any) => ({
              id: String(item.place_id || Math.random()),
              name: item.display_name,
              lat: parseFloat(item.lat),
              lon: parseFloat(item.lon),
            }))
          );
        }
      } catch (err) {
        console.warn('Error buscando sugerencias de mapa:', err);
      } finally {
        setIsSearchingSuggestions(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [location]);

  // 1. Abrir la cámara física del celular
  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permiso necesario',
          'Se necesita acceso a la cámara para tomar fotos del producto.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
        allowsEditing: true,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newPhotoUri = result.assets[0].uri;
        setPhotos((prev) => [...prev, newPhotoUri].slice(0, 10));
      }
    } catch (err: any) {
      console.error('[UploadProductView.handleTakePhoto] Error:', err);
      Alert.alert('Error', 'No se pudo abrir la cámara en este dispositivo.');
    }
  };

  // 2. Elegir fotos desde la galería
  const handlePickFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso necesario', 'Se requiere acceso a la galería para subir fotos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 10 - photos.length,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedUris = result.assets.map((asset) => asset.uri);
        setPhotos((prev) => [...prev, ...selectedUris].slice(0, 10));
      }
    } catch (err: any) {
      console.error('[UploadProductView.handlePickFromGallery] Error:', err);
      Alert.alert('Error', 'No se pudieron cargar las imágenes seleccionadas.');
    }
  };

  // 3. Abrir modal para elegir Cámara o Galería
  const handlePickImages = () => {
    if (photos.length >= 10) {
      Alert.alert('Límite alcanzado', 'Puedes subir un máximo de 10 fotos.');
      return;
    }
    setPhotoModalVisible(true);
  };

  // 4. Seleccionar una sugerencia tipo Maps
  const handleSelectSuggestion = (sugg: { name: string; lat: number; lon: number }) => {
    const parts = sugg.name.split(',');
    const shortAddress = parts.slice(0, 2).join(',').trim();
    setLocation(shortAddress || sugg.name);
    setCoordinates({ latitude: sugg.lat, longitude: sugg.lon });
    setSuggestions([]);
  };

  // 5. Obtener la ubicación GPS del dispositivo móvil
  const handleRequestGPS = async () => {
    try {
      setIsLocatingGPS(true);
      const { coords, error } = await locationService.getCurrentLocation();
      if (error) {
        Alert.alert('Aviso de GPS', error);
        return;
      }
      if (coords) {
        setCoordinates(coords);
        setLocation('Mi ubicación actual');
        setSuggestions([]);
      }
    } catch (err: any) {
      console.error('[UploadProductView.handleRequestGPS] Error:', err);
      Alert.alert('Error', 'No se pudo obtener la posición GPS del dispositivo.');
    } finally {
      setIsLocatingGPS(false);
    }
  };

  // Eliminar foto seleccionada
  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  // Publicar Producto en Supabase
  const handlePublish = async () => {
    setErrorMessage(null);

    const cleanTitle = title.trim() || quickInfo.trim();
    if (!cleanTitle) {
      setErrorMessage('Por favor ingresa un título o descripción para tu anuncio.');
      return;
    }

    if (!selectedCategory) {
      setErrorMessage('Por favor selecciona una categoría para tu producto.');
      return;
    }

    const cleanPrice = parseFloat(price.replace(/[^0-9.]/g, ''));
    if (isNaN(cleanPrice) || cleanPrice <= 0) {
      setErrorMessage('Por favor ingresa un precio válido mayor a 0.');
      return;
    }

    setIsSubmitting(true);
    setUploadStatus('Subiendo imágenes al almacenamiento...');

    try {
      let finalPublicUrls: string[] = [];

      if (photos.length > 0) {
        finalPublicUrls = await storageService.uploadMultipleProductImages(photos, 'products');
      } else {
        finalPublicUrls = [DEFAULT_PRODUCT_FALLBACK];
      }

      setUploadStatus('Guardando publicación en la base de datos...');

      const finalDescription = description.trim() || quickInfo.trim() || cleanTitle;

      await productService.createProduct({
        category_id: selectedCategory.id,
        title: cleanTitle,
        description: finalDescription,
        price: cleanPrice,
        currency: currency,
        condition: condition,
        location: location.trim() || 'Pilar',
        images: finalPublicUrls,
      });

      setSuccessModalVisible(true);
    } catch (err: any) {
      console.error('[UploadProductView.handlePublish] Error:', err);
      setErrorMessage(err.message || 'Ocurrió un error al publicar el producto. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
      setUploadStatus('');
    }
  };

  const handleFinishSuccess = () => {
    setSuccessModalVisible(false);
    setTitle('');
    setDescription('');
    setQuickInfo('');
    setPrice('');
    setPhotos([]);
    setSelectedCategory(null);
    if (onProductCreated) {
      onProductCreated();
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.mainTitle}>Subí tu anuncio</Text>

      {/* Hero Banner */}
      <View style={styles.heroBanner}>
        <View style={styles.heroBannerContent}>
          <Ionicons name="sparkles" size={24} color="#0D9488" />
          <Text style={styles.heroBannerTitle}>Publicá gratis y vendé en minutos</Text>
          <Text style={styles.heroBannerSubtitle}>Llega a miles de compradores cerca de tu zona</Text>
        </View>
      </View>

      {/* SECCIÓN 1: Información del producto */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionHeaderTitle}>Información del producto</Text>
        <Text style={styles.sectionSubtitle}>¿Qué vendes? Proporcioná una detallada información de tu venta</Text>

        <View style={styles.textareaContainer}>
          <TextInput
            style={styles.textarea}
            placeholder="Escribe una breve descripción del producto..."
            placeholderTextColor="#9098B1"
            value={quickInfo}
            onChangeText={setQuickInfo}
            multiline
            numberOfLines={4}
            maxLength={200}
          />
          <Text style={styles.charCount}>{quickInfo.length}/200</Text>
        </View>

        <Text style={styles.inputHint}>
          Agregá información como palabras clave, marca, modelo, tamaño, color, etc.
        </Text>

        <View style={styles.continueRow}>
          <TouchableOpacity
            style={styles.continueBtn}
            onPress={() => {
              if (!title && quickInfo) {
                setTitle(quickInfo.slice(0, 50));
              }
            }}
          >
            <Text style={styles.continueBtnText}>Continuar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* SECCIÓN 2: Fotos */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionHeaderTitle}>Fotos</Text>

        {/* Dropzone de carga */}
        <TouchableOpacity style={styles.dropzone} activeOpacity={0.8} onPress={handlePickImages}>
          <View style={styles.uploadBtnOutline}>
            <Ionicons name="camera-outline" size={18} color="#0D9488" style={{ marginRight: 6 }} />
            <Text style={styles.uploadBtnOutlineText}>Agregar fotos (Cámara / Galería)</Text>
          </View>
          <Text style={styles.dropzoneTitle}>Toca aquí para tomar foto o elegir archivos</Text>
          <Text style={styles.dropzoneHint}>Formatos aceptados: JPEG, PNG, WEBP (máx. 10MB)</Text>
          <Text style={styles.dropzoneHint}>Mínimo 1 foto, máximo 10 fotos</Text>
        </TouchableOpacity>

        {/* Galería de Slots */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoSlotsRow}>
          {photos.map((uri, index) => (
            <View key={index} style={styles.photoSlotFilled}>
              <Image source={{ uri }} style={styles.photoThumbnail} />
              {index === 0 && (
                <View style={styles.coverBadge}>
                  <Text style={styles.coverBadgeText}>Portada</Text>
                </View>
              )}
              <TouchableOpacity
                style={styles.removePhotoBtn}
                onPress={() => handleRemovePhoto(index)}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Ionicons name="close-circle" size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ))}

          {Array.from({ length: Math.max(0, 3 - photos.length) }).map((_, i) => (
            <TouchableOpacity key={`empty-${i}`} style={styles.photoSlotEmpty} onPress={handlePickImages}>
              <Ionicons name="camera-outline" size={28} color="#CBD5E1" />
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.continueRow}>
          <TouchableOpacity style={styles.continueBtn} onPress={handlePickImages}>
            <Text style={styles.continueBtnText}>Continuar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* SECCIÓN 3: Categoría y Datos */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionHeaderTitle}>Selecciona una categoría para tu anuncio</Text>
        <Text style={styles.sectionSubtitle}>
          Indicá en qué categoría encaja mejor tu producto para que los compradores puedan encontrarlo más rápido.
        </Text>

        <TouchableOpacity
          style={styles.selectInput}
          activeOpacity={0.7}
          onPress={() => setCategoryModalVisible(true)}
        >
          <Text style={selectedCategory ? styles.selectInputValue : styles.selectInputPlaceholder}>
            {selectedCategory ? selectedCategory.name : 'Categoría y subcategoría'}
          </Text>
          <Ionicons name="chevron-down" size={18} color="#1F232E" />
        </TouchableOpacity>

        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textInput}
            placeholder="Título*"
            placeholderTextColor="#9098B1"
            value={title}
            onChangeText={setTitle}
            maxLength={60}
          />
          <Text style={styles.charCountInside}>{title.length}/60</Text>
        </View>

        <View style={styles.textareaWrapper}>
          <TextInput
            style={styles.textareaMain}
            placeholder="Descripción*"
            placeholderTextColor="#9098B1"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            maxLength={500}
          />
          <Text style={styles.charCountInside}>{description.length}/500</Text>
        </View>

        <TouchableOpacity
          style={styles.selectInput}
          activeOpacity={0.7}
          onPress={() => setConditionModalVisible(true)}
        >
          <Text style={styles.selectInputValue}>
            Estado: {CONDITION_OPTIONS.find((c) => c.value === condition)?.label || 'Como nuevo'}
          </Text>
          <Ionicons name="chevron-down" size={18} color="#1F232E" />
        </TouchableOpacity>

        <View style={styles.priceRow}>
          <TextInput
            style={[styles.textInput, { flex: 1 }]}
            placeholder="Precio*"
            placeholderTextColor="#9098B1"
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
          />
          <TouchableOpacity
            style={styles.currencyToggle}
            onPress={() => setCurrencyModalVisible(true)}
          >
            <Text style={styles.currencyToggleText}>{currency}</Text>
            <Ionicons name="chevron-down" size={14} color="#1F232E" style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        </View>
      </View>

      {/* SECCIÓN 4: Envíos */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionHeaderTitle}>Opciones de envío</Text>

        <View style={styles.shippingBanner}>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={16} color="#0D9488" style={{ marginRight: 6 }} />
            <Text style={styles.benefitText}>Envíos protegidos</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={16} color="#0D9488" style={{ marginRight: 6 }} />
            <Text style={styles.benefitText}>Dinero asegurado hasta entrega cumplida</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={16} color="#0D9488" style={{ marginRight: 6 }} />
            <Text style={styles.benefitText}>Cobrá todo lo que ganas, sin comisiones</Text>
          </View>
          <TouchableOpacity style={{ marginTop: 4 }}>
            <Text style={styles.linkText}>¿Cómo funciona Soltapp?</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.switchRow}>
          <View>
            <Text style={styles.switchLabel}>Activar envíos</Text>
            <Text style={styles.switchSublabel}>¿Cuánto pesa?</Text>
          </View>
          <Switch
            value={shippingActive}
            onValueChange={setShippingActive}
            trackColor={{ false: '#CBD5E1', true: '#3BD7C2' }}
            thumbColor="#FFFFFF"
          />
        </View>

        {shippingActive && (
          <View style={styles.weightSection}>
            <Text style={styles.weightSubtitle}>
              Elegí el peso que corresponda al producto. Recordá no contar el peso de la caja envoltorio.
            </Text>

            {WEIGHT_OPTIONS.map((wOption) => {
              const isSelected = selectedWeight === wOption;
              return (
                <TouchableOpacity
                  key={wOption}
                  style={styles.radioRow}
                  activeOpacity={0.7}
                  onPress={() => setSelectedWeight(wOption)}
                >
                  <Text style={[styles.radioLabel, isSelected && styles.radioLabelActive]}>{wOption}</Text>
                  <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                    {isSelected && <View style={styles.radioInnerCircle} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      {/* SECCIÓN 5: Localización, Sugerencias tipo Maps y GPS */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionHeaderTitle}>Tus productos se verán en</Text>

        <View style={styles.locationInputBox}>
          <Ionicons name="location-sharp" size={18} color="#0D9488" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.locationInput}
            value={location}
            onChangeText={setLocation}
            placeholder="Escribe tu calle, barrio o ciudad..."
            placeholderTextColor="#9098B1"
          />
          {isSearchingSuggestions ? (
            <ActivityIndicator size="small" color="#0D9488" />
          ) : location.length > 0 ? (
            <TouchableOpacity onPress={() => setLocation('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={16} color="#9098B1" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Menú desplegable flotante de Sugerencias tipo Google Maps */}
        {suggestions.length > 0 && (
          <View style={styles.suggestionsDropdown}>
            {suggestions.map((sugg) => (
              <TouchableOpacity
                key={sugg.id}
                style={styles.suggestionRow}
                activeOpacity={0.7}
                onPress={() => handleSelectSuggestion(sugg)}
              >
                <Ionicons name="location-outline" size={16} color="#0D9488" style={{ marginRight: 8 }} />
                <Text style={styles.suggestionText} numberOfLines={2}>
                  {sugg.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Mapa Interactivo con Sensor GPS */}
        <InteractiveLocationMap
          coordinates={coordinates}
          onCoordinatesChange={(newCoords) => setCoordinates(newCoords)}
          onRequestGPS={handleRequestGPS}
          loading={isLocatingGPS}
          loadingText="Buscando ubicación..."
          height={200}
        />

        <Text style={styles.locationDisclaimer}>
          Esta es la localización asociada a tu perfil. Salvo que la cambies, aquí es donde verán todos tus productos.
        </Text>

        {errorMessage && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={18} color="#EF4444" style={{ marginRight: 6 }} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.publishBtn, isSubmitting && styles.publishBtnDisabled]}
          activeOpacity={0.85}
          onPress={handlePublish}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator size="small" color="#1F232E" style={{ marginRight: 8 }} />
              <Text style={styles.publishBtnText}>{uploadStatus || 'Publicando...'}</Text>
            </View>
          ) : (
            <Text style={styles.publishBtnText}>Publicar</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* MODAL 1: Opciones de Cámara vs Galería */}
      <Modal visible={photoModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.photoSourceCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Agregar fotos del producto</Text>
              <TouchableOpacity onPress={() => setPhotoModalVisible(false)}>
                <Ionicons name="close" size={24} color="#1F232E" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.photoSourceBtn}
              activeOpacity={0.75}
              onPress={() => {
                setPhotoModalVisible(false);
                handleTakePhoto();
              }}
            >
              <View style={styles.photoSourceIconCircle}>
                <Ionicons name="camera" size={24} color="#0D9488" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.photoSourceBtnTitle}>Tomar foto con la cámara</Text>
                <Text style={styles.photoSourceBtnSubtitle}>Usa la cámara en vivo para fotografiar el artículo</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#9098B1" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.photoSourceBtn}
              activeOpacity={0.75}
              onPress={() => {
                setPhotoModalVisible(false);
                handlePickFromGallery();
              }}
            >
              <View style={styles.photoSourceIconCircle}>
                <Ionicons name="images" size={24} color="#0D9488" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.photoSourceBtnTitle}>Elegir de la galería</Text>
                <Text style={styles.photoSourceBtnSubtitle}>Selecciona fotos guardadas en tu dispositivo</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#9098B1" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.photoCancelBtn} onPress={() => setPhotoModalVisible(false)}>
              <Text style={styles.photoCancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: Selector de Categorías */}
      <Modal visible={categoryModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecciona una Categoría</Text>
              <TouchableOpacity onPress={() => setCategoryModalVisible(false)}>
                <Ionicons name="close" size={24} color="#1F232E" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 350 }}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={styles.modalOptionItem}
                  onPress={() => {
                    setSelectedCategory(cat);
                    setCategoryModalVisible(false);
                  }}
                >
                  <Text style={[styles.modalOptionText, selectedCategory?.id === cat.id && styles.modalOptionActive]}>
                    {cat.name}
                  </Text>
                  {selectedCategory?.id === cat.id && <Ionicons name="checkmark" size={20} color="#0D9488" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL 3: Selector de Condición */}
      <Modal visible={conditionModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Estado del Producto</Text>
              <TouchableOpacity onPress={() => setConditionModalVisible(false)}>
                <Ionicons name="close" size={24} color="#1F232E" />
              </TouchableOpacity>
            </View>
            {CONDITION_OPTIONS.map((c) => (
              <TouchableOpacity
                key={c.value}
                style={styles.modalOptionItem}
                onPress={() => {
                  setCondition(c.value);
                  setConditionModalVisible(false);
                }}
              >
                <Text style={[styles.modalOptionText, condition === c.value && styles.modalOptionActive]}>
                  {c.label}
                </Text>
                {condition === c.value && <Ionicons name="checkmark" size={20} color="#0D9488" />}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* MODAL 4: Selector de Moneda */}
      <Modal visible={currencyModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecciona la Moneda</Text>
              <TouchableOpacity onPress={() => setCurrencyModalVisible(false)}>
                <Ionicons name="close" size={24} color="#1F232E" />
              </TouchableOpacity>
            </View>
            {(['ARS', 'USD'] as const).map((curr) => (
              <TouchableOpacity
                key={curr}
                style={styles.modalOptionItem}
                onPress={() => {
                  setCurrency(curr);
                  setCurrencyModalVisible(false);
                }}
              >
                <Text style={[styles.modalOptionText, currency === curr && styles.modalOptionActive]}>
                  {curr === 'ARS' ? 'Pesos Argentinos (ARS)' : 'Dólares Estadounidenses (USD)'}
                </Text>
                {currency === curr && <Ionicons name="checkmark" size={20} color="#0D9488" />}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* MODAL 5: Éxito de Publicación */}
      <Modal visible={successModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.successModalCard}>
            <View style={styles.successIconCircle}>
              <Ionicons name="checkmark" size={32} color="#FFFFFF" />
            </View>
            <Text style={styles.successModalTitle}>¡Producto publicado!</Text>
            <Text style={styles.successModalSubtitle}>
              Tu artículo ya se encuentra disponible y visible en el catálogo de Soltapp.
            </Text>
            <TouchableOpacity style={styles.successModalBtn} onPress={handleFinishSuccess}>
              <Text style={styles.successModalBtnText}>Ver en Inicio</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 120, // Espacio para que el botón Publicar no quede tapado por la barra inferior
    gap: 16,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F232E',
    marginTop: 4,
  },
  heroBanner: {
    backgroundColor: '#E2E8F0',
    borderRadius: 16,
    padding: 16,
    minHeight: 90,
    justifyContent: 'center',
  },
  heroBannerContent: {
    gap: 4,
  },
  heroBannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F232E',
  },
  heroBannerSubtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    gap: 12,
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F232E',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
  },
  textareaContainer: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#FFFFFF',
  },
  textarea: {
    fontSize: 13,
    color: '#1F232E',
    minHeight: 70,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 11,
    color: '#9098B1',
    textAlign: 'right',
    marginTop: 4,
  },
  inputHint: {
    fontSize: 11,
    color: '#9098B1',
    lineHeight: 15,
  },
  continueRow: {
    alignItems: 'flex-end',
    marginTop: 4,
  },
  continueBtn: {
    backgroundColor: '#3BD7C2',
    paddingVertical: 7,
    paddingHorizontal: 18,
    borderRadius: 20,
  },
  continueBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F232E',
  },
  dropzone: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
  },
  uploadBtnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#3BD7C2',
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    marginBottom: 4,
  },
  uploadBtnOutlineText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0D9488',
  },
  dropzoneTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F232E',
  },
  dropzoneHint: {
    fontSize: 11,
    color: '#9098B1',
  },
  photoSlotsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 4,
  },
  photoSlotEmpty: {
    width: 86,
    height: 86,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoSlotFilled: {
    width: 86,
    height: 86,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    position: 'relative',
  },
  photoThumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  coverBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(29, 233, 182, 0.9)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  coverBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#1F232E',
  },
  removePhotoBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
  },
  selectInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  selectInputPlaceholder: {
    fontSize: 13,
    color: '#9098B1',
  },
  selectInputValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1F232E',
  },
  inputWrapper: {
    position: 'relative',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 13,
    color: '#1F232E',
    backgroundColor: '#FFFFFF',
  },
  textareaWrapper: {
    position: 'relative',
  },
  textareaMain: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingTop: 11,
    paddingBottom: 24,
    fontSize: 13,
    color: '#1F232E',
    backgroundColor: '#FFFFFF',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCountInside: {
    position: 'absolute',
    bottom: 6,
    right: 12,
    fontSize: 10,
    color: '#9098B1',
  },
  priceRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  currencyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    backgroundColor: '#F8FAFC',
  },
  currencyToggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F232E',
  },
  shippingBanner: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  benefitText: {
    fontSize: 12,
    color: '#1F232E',
  },
  linkText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0D9488',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F232E',
  },
  switchSublabel: {
    fontSize: 12,
    color: '#64748B',
  },
  weightSection: {
    gap: 8,
    paddingTop: 4,
  },
  weightSubtitle: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F1F5F9',
  },
  radioLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  radioLabelActive: {
    color: '#1F232E',
    fontWeight: '600',
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: {
    borderColor: '#0D9488',
  },
  radioInnerCircle: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#0D9488',
  },
  locationInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
  },
  locationInput: {
    flex: 1,
    fontSize: 13,
    color: '#1F232E',
  },
  suggestionsDropdown: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: -4,
    maxHeight: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 4,
    zIndex: 50,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F1F5F9',
  },
  suggestionText: {
    fontSize: 12,
    color: '#1F232E',
    flex: 1,
  },
  locationDisclaimer: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 15,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 10,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    flex: 1,
  },
  publishBtn: {
    backgroundColor: '#3BD7C2',
    borderRadius: 24,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#3BD7C2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  publishBtnDisabled: {
    opacity: 0.6,
  },
  publishBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F232E',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    gap: 12,
    maxHeight: 450,
  },
  photoSourceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    gap: 12,
  },
  photoSourceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    gap: 12,
  },
  photoSourceIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoSourceBtnTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F232E',
  },
  photoSourceBtnSubtitle: {
    fontSize: 11,
    color: '#64748B',
  },
  photoCancelBtn: {
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 4,
  },
  photoCancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F232E',
  },
  modalOptionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F1F5F9',
  },
  modalOptionText: {
    fontSize: 14,
    color: '#1F232E',
  },
  modalOptionActive: {
    color: '#0D9488',
    fontWeight: '700',
  },
  successModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  successIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1DE9B6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  successModalTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#1F232E',
  },
  successModalSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  successModalBtn: {
    backgroundColor: '#3BD7C2',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 24,
    marginTop: 8,
    width: '100%',
    alignItems: 'center',
  },
  successModalBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F232E',
  },
});