import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Platform,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../supabase';
import CategoriesMenuModal from '../components/CategoriesMenuModal';
import BottomNavbar from '../components/BottomNavbar';
import TopNavbar from '../components/TopNavbar';
import InteractiveLocationMap, {
  LocationCoordinates,
  DEFAULT_COORDINATES,
} from '../components/InteractiveLocationMap';
import * as ImagePicker from 'expo-image-picker';
import { storageService } from '../services/storageService';
import { locationService } from '../services/locationService';

// Componentes SVG oficiales de Soltapp
import IsotipoConFondo from '../../assets/svgs/isotipo con fondo.svg';
import BuscarIcon from '../../assets/svgs/Buscar.svg';
import VerTodoIcon from '../../assets/svgs/Ver todo.svg';
import AvatarIcon from '../../assets/svgs/Avatar.svg';
import HomeIcon from '../../assets/svgs/Home.svg';
import CorazonIcon from '../../assets/svgs/Corazón.svg';
import MasIcon from '../../assets/svgs/Más.svg';
import MailIcon from '../../assets/svgs/mail.svg';

export default function ProfileScreen() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'profile' | 'cuenta'>('profile');
  const [categoriesModalVisible, setCategoriesModalVisible] = useState(false);

  // Estado de avatar y subida de foto de perfil
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState<boolean>(false);
  const [avatarStatus, setAvatarStatus] = useState<{
    type: 'info' | 'success' | 'warning' | 'error';
    text: string;
  } | null>(null);

  // Campos de Información pública editables
  const [firstName, setFirstName] = useState('Manuel');
  const [lastName, setLastName] = useState('Sans');
  const [location, setLocation] = useState('1629, Pilar');

  // Coordenadas geográficas y estado de geolocalización
  const [coordinates, setCoordinates] = useState<LocationCoordinates>(DEFAULT_COORDINATES);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [isSearchingAddress, setIsSearchingAddress] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Campos de Información personal (Pestaña Cuenta)
  const [birthDate, setBirthDate] = useState('12/13/1998');
  const [gender, setGender] = useState<'hombre' | 'mujer' | null>(null);
  const [isSavingPersonal, setIsSavingPersonal] = useState(false);
  const [personalSaveMessage, setPersonalSaveMessage] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setCurrentUser(user);
        populateUserData(user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
      if (session?.user) {
        populateUserData(session.user);
      }
    });

    return () => {
      subscription.unsubscribe();
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const populateUserData = (user: any) => {
    const meta = user?.user_metadata || {};
    const fullName = meta.full_name || meta.name || '';
    if (fullName) {
      const parts = fullName.trim().split(' ');
      if (parts.length > 1) {
        setFirstName(parts[0]);
        setLastName(parts.slice(1).join(' '));
      } else {
        setFirstName(fullName);
      }
    }
    if (meta.first_name) setFirstName(meta.first_name);
    if (meta.last_name) setLastName(meta.last_name);
    if (meta.ubicacion_texto) {
      setLocation(meta.ubicacion_texto);
    } else if (meta.location) {
      setLocation(meta.location);
    }

    // Cargar coordenadas si ya estaban guardadas en Supabase
    // Cargar fecha de nacimiento y sexo
    if (meta.fecha_nacimiento) setBirthDate(meta.fecha_nacimiento);
    else if (meta.birthdate) setBirthDate(meta.birthdate);
    if (meta.sexo) setGender(meta.sexo);
    else if (meta.gender) setGender(meta.gender);

    if (meta.latitud && meta.longitud) {
      setCoordinates({
        latitude: Number(meta.latitud),
        longitude: Number(meta.longitud),
      });
    } else if (meta.latitude && meta.longitude) {
      setCoordinates({
        latitude: Number(meta.latitude),
        longitude: Number(meta.longitude),
      });
    }
  };

  const userAvatar =
    currentUser?.user_metadata?.avatar_url ||
    currentUser?.user_metadata?.picture ||
    null;

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  // Selector de imagen compatible con Web (input file nativo) y Móvil (expo-image-picker)
  const pickImage = async (): Promise<string | null> => {
    if (Platform.OS === 'web') {
      return new Promise((resolve) => {
        if (typeof document === 'undefined') {
          resolve(null);
          return;
        }
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.style.display = 'none';

        input.onchange = (e: any) => {
          const file = e.target?.files?.[0];
          if (!file) {
            resolve(null);
            return;
          }
          const blobUrl = URL.createObjectURL(file);
          resolve(blobUrl);
          try {
            document.body.removeChild(input);
          } catch (_) {}
        };

        input.oncancel = () => {
          resolve(null);
          try {
            document.body.removeChild(input);
          } catch (_) {}
        };

        document.body.appendChild(input);
        input.click();
      });
    }

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showAlert(
          'Permiso necesario',
          'Se requiere acceso a la galería para cambiar tu foto de perfil.'
        );
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        return result.assets[0].uri;
      }
      return null;
    } catch (pickerErr) {
      console.error('[ProfileScreen.pickImage] Error:', pickerErr);
      return null;
    }
  };

  // Subida y persistencia de foto de perfil a Supabase Storage y Base de Datos
  const handleChangeAvatar = async () => {
    setAvatarStatus(null);

    const selectedUri = await pickImage();
    if (!selectedUri) return;

    // Vista previa inmediata para mejor respuesta visual
    setAvatarUrl(selectedUri);
    setIsUploadingAvatar(true);
    setAvatarStatus({ type: 'info', text: 'Subiendo foto de perfil...' });

    try {
      let user = currentUser;
      if (!user) {
        const { data: authData } = await supabase.auth.getUser();
        user = authData?.user ?? null;
        if (user) setCurrentUser(user);
      }

      // Subir al almacenamiento en Supabase Storage
      const uploadedPublicUrl = await storageService.uploadAvatar(
        selectedUri,
        user?.id
      );

      // Actualizar estado local con URL remota final
      setAvatarUrl(uploadedPublicUrl);

      if (user) {
        // 1. Guardar en user_metadata de Auth
        const { data: authUpdateData, error: authErr } = await supabase.auth.updateUser({
          data: {
            avatar_url: uploadedPublicUrl,
            picture: uploadedPublicUrl,
          },
        });

        if (authErr) {
          console.error('[ProfileScreen] Error Auth updateUser:', authErr.message);
        } else if (authUpdateData?.user) {
          setCurrentUser(authUpdateData.user);
        }

        // 2. Guardar en tabla pública users
        try {
          const { error: tableErr } = await supabase
            .from('users')
            .upsert(
              {
                id: user.id,
                avatar_url: uploadedPublicUrl,
                full_name: `${firstName} ${lastName}`.trim() || undefined,
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'id' }
            );

          if (tableErr) {
            console.warn('[ProfileScreen] Error tabla users:', tableErr.message);
          }
        } catch (dbErr) {
          console.warn('[ProfileScreen] Excepción users:', dbErr);
        }

        setAvatarStatus({
          type: 'success',
          text: '¡Foto de perfil guardada con éxito!',
        });
        showAlert('¡Foto actualizada!', 'Tu foto de perfil se guardó correctamente en tu cuenta.');
      } else {
        setAvatarStatus({
          type: 'warning',
          text: 'Foto cargada en vista previa. Inicia sesión para guardarla en tu cuenta.',
        });
        showAlert(
          'Sesión requerida',
          'Debes haber iniciado sesión con tu cuenta para que la foto se guarde permanentemente en la base de datos.'
        );
      }
    } catch (uploadErr: any) {
      console.error('[ProfileScreen.handleChangeAvatar] Error:', uploadErr);
      setAvatarStatus({
        type: 'error',
        text: 'Error al subir la imagen: ' + (uploadErr?.message || 'Error de conexión'),
      });
      showAlert('Error al cambiar foto', uploadErr?.message || 'No se pudo subir la foto de perfil.');
    } finally {
      setIsUploadingAvatar(false);
      setTimeout(() => {
        setAvatarStatus(null);
      }, 5000);
    }
  };

  // Búsqueda de ubicación ingresada por el usuario (geocodificación directa)
  const handleSearchAddress = async (addressText: string) => {
    const query = addressText.trim();
    if (!query || query.length < 3) return;

    setIsSearchingAddress(true);
    setLocationError(null);
    try {
      const result = await locationService.geocodeAddress(query);
      if (result) {
        setCoordinates({
          latitude: result.latitude,
          longitude: result.longitude,
        });
        setLocationError(null);
      } else {
        setLocationError(
          'No se encontró la dirección indicada en el mapa. Intenta con una ciudad, código postal o calle más detallada.'
        );
      }
    } catch (err) {
      console.warn('[ProfileScreen.handleSearchAddress] Error:', err);
      setLocationError('No se pudo buscar la dirección. Verifica tu conexión a internet.');
    } finally {
      setIsSearchingAddress(false);
    }
  };

  // Manejo de cambio de texto en el input con debounce para buscar automáticamente
  const handleLocationTextChange = (text: string) => {
    setLocation(text);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (text.trim().length >= 3) {
      searchTimeoutRef.current = setTimeout(() => {
        handleSearchAddress(text);
      }, 900);
    }
  };

  // Obtener posición GPS actual con expo-location ("Localizarme")
  const handleRequestGPS = async () => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    setIsLocating(true);
    setLocationError(null);
    try {
      const { coords, error } = await locationService.getCurrentLocation();
      if (error || !coords) {
        setLocationError(
          error || 'Permiso de ubicación denegado. Puedes arrastrar el marcador en el mapa para situar tu punto manualmente.'
        );
        return;
      }

      setCoordinates(coords);

      const addressText = await locationService.reverseGeocodeCoords(coords);
      if (addressText) {
        setLocation(addressText);
      }
    } catch (err: any) {
      console.error('[ProfileScreen.handleRequestGPS] Error:', err);
      setLocationError('No se pudo obtener la posición GPS. Verifica que esté habilitado en tu dispositivo.');
    } finally {
      setIsLocating(false);
    }
  };

  // Callback al arrastrar y soltar el marcador en el mapa
  const handleMarkerCoordinatesChange = async (newCoords: LocationCoordinates) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    setCoordinates(newCoords);
    const addressText = await locationService.reverseGeocodeCoords(newCoords);
    if (addressText) {
      setLocation(addressText);
    }
  };

  const handleSavePersonal = async () => {
    try {
      setIsSavingPersonal(true);
      setPersonalSaveMessage(null);
      const { data, error } = await supabase.auth.updateUser({
        data: {
          fecha_nacimiento: birthDate.trim(),
          sexo: gender,
        },
      });
      if (error) {
        setPersonalSaveMessage('Error al guardar: ' + error.message);
      } else {
        if (data?.user) {
          setCurrentUser(data.user);
        }
        setPersonalSaveMessage('¡Información personal guardada!');
        setTimeout(() => setPersonalSaveMessage(null), 3000);
      }
    } catch (err) {
      setPersonalSaveMessage('Error de conexión.');
    } finally {
      setIsSavingPersonal(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setSaveMessage(null);
      const fullNameCombined = `${firstName.trim()} ${lastName.trim()}`.trim();

      // Payload completo para Supabase incluyendo texto y coordenadas geográficas
      const payloadData = {
        full_name: fullNameCombined,
        name: fullNameCombined,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        location: location.trim(),
        ubicacion_texto: location.trim(),
        latitud: coordinates.latitude,
        longitud: coordinates.longitude,
      };

      const { data, error } = await supabase.auth.updateUser({
        data: payloadData,
      });

      if (error) {
        setSaveMessage('Error al guardar los cambios: ' + error.message);
      } else {
        if (data?.user) {
          setCurrentUser(data.user);
        }

        // Sincronización en tabla public.users si está configurada
        try {
          if (currentUser?.id) {
            await supabase
              .from('users')
              .update({
                full_name: fullNameCombined,
                updated_at: new Date().toISOString(),
              })
              .eq('id', currentUser.id);
          }
        } catch (_) {
          // Ignorar silenciosamente si no existen columnas adicionales en users
        }

        setSaveMessage('¡Perfil guardado correctamente!');
        setTimeout(() => setSaveMessage(null), 3000);
      }
    } catch (err) {
      setSaveMessage('Error de conexión.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/login' as any);
  };

  const goToPublicProfile = () => {
    router.push('/public-profile' as any);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.container}>
        {/* ========================================================= */}
        {/* 1. HEADER NAVBAR SUPERIOR OFICIAL (COMPARTIDO)           */}
        {/* ========================================================= */}
        <TopNavbar activeScreen="profile" onOpenCategories={() => setCategoriesModalVisible(true)} onAvatarPress={goToPublicProfile} userAvatar={userAvatar} />

        {/* ========================================================= */}
        {/* 2. CONTENIDO PRINCIPAL: PANTALLA "TU PERFIL" (Figma Exacto)*/}
        {/* ========================================================= */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Título y Subtítulo */}
          <Text style={styles.headingTitle}>Tu perfil</Text>
          <Text style={styles.headingSubtitle}>
            Aquí podrás ver y editar los datos de tu perfil
          </Text>

          {/* Enlace: Ver mi perfil público */}
          <TouchableOpacity
            onPress={goToPublicProfile}
            activeOpacity={0.7}
            style={styles.publicProfileLinkWrapper}
          >
            <Text style={styles.publicProfileLinkText}>Ver mi perfil público</Text>
          </TouchableOpacity>

          {/* Selector de Pestañas: Perfil / Cuenta */}
          <View style={styles.segmentedControl}>
            <TouchableOpacity
              style={[
                styles.segmentButton,
                activeTab === 'profile' && styles.segmentButtonActive,
              ]}
              onPress={() => setActiveTab('profile')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.segmentButtonText,
                  activeTab === 'profile' && styles.segmentButtonTextActive,
                ]}
              >
                Perfil
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.segmentButton,
                activeTab === 'cuenta' && styles.segmentButtonActive,
              ]}
              onPress={() => setActiveTab('cuenta')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.segmentButtonText,
                  activeTab === 'cuenta' && styles.segmentButtonTextActive,
                ]}
              >
                Cuenta
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'profile' ? (
            <>
              {/* Sección: Foto de perfil */}
              <Text style={styles.sectionTitle}>Foto de perfil</Text>

              {/* Foto principal */}
              <Text style={styles.fieldLabel}>Foto principal</Text>
              <View style={styles.mainPhotoRow}>
                <TouchableOpacity
                  style={styles.mainPhotoCircle}
                  onPress={handleChangeAvatar}
                  disabled={isUploadingAvatar}
                  activeOpacity={0.8}
                >
                  {userAvatar ? (
                    <Image source={{ uri: userAvatar }} style={styles.mainPhotoImage} />
                  ) : (
                    <View style={styles.mainPhotoPlaceholder}>
                      <Text style={styles.mainPhotoPlaceholderText}>
                        {firstName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  {isUploadingAvatar && (
                    <View style={styles.avatarLoadingOverlay}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.changePhotoButton, isUploadingAvatar && { opacity: 0.7 }]}
                  activeOpacity={0.75}
                  onPress={handleChangeAvatar}
                  disabled={isUploadingAvatar}
                >
                  {isUploadingAvatar ? (
                    <ActivityIndicator size="small" color="#1F232E" />
                  ) : (
                    <Text style={styles.changePhotoButtonText}>Cambiar foto</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Banner de estado de foto de perfil */}
              {avatarStatus && (
                <View
                  style={[
                    styles.avatarStatusBanner,
                    avatarStatus.type === 'success' && styles.avatarStatusSuccess,
                    avatarStatus.type === 'error' && styles.avatarStatusError,
                    avatarStatus.type === 'warning' && styles.avatarStatusWarning,
                    avatarStatus.type === 'info' && styles.avatarStatusInfo,
                  ]}
                >
                  <Ionicons
                    name={
                      avatarStatus.type === 'success'
                        ? 'checkmark-circle'
                        : avatarStatus.type === 'error'
                        ? 'close-circle'
                        : avatarStatus.type === 'warning'
                        ? 'warning'
                        : 'information-circle'
                    }
                    size={16}
                    color={
                      avatarStatus.type === 'success'
                        ? '#0D9488'
                        : avatarStatus.type === 'error'
                        ? '#E11D48'
                        : avatarStatus.type === 'warning'
                        ? '#D97706'
                        : '#3B82F6'
                    }
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.avatarStatusText,
                      {
                        color:
                          avatarStatus.type === 'success'
                            ? '#0D9488'
                            : avatarStatus.type === 'error'
                            ? '#E11D48'
                            : avatarStatus.type === 'warning'
                            ? '#D97706'
                            : '#3B82F6',
                      },
                    ]}
                  >
                    {avatarStatus.text}
                  </Text>
                </View>
              )}

              {/* Sección: Información pública */}
              <Text style={[styles.sectionTitle, { marginTop: 28 }]}>
                Información pública
              </Text>

              {/* Input: Nombre */}
              <Text style={styles.fieldLabel}>Nombre</Text>
              <TextInput
                style={styles.textInput}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Nombre"
                placeholderTextColor="#9098B1"
              />

              {/* Input: Apellidos */}
              <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Apellidos</Text>
              <TextInput
                style={styles.textInput}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Apellidos"
                placeholderTextColor="#9098B1"
              />

              {/* Input: Ubicación de tus productos con botón GPS y búsqueda */}
              <View style={styles.locationHeaderRow}>
                <Text style={styles.fieldLabel}>Ubicación de tus productos</Text>
                <TouchableOpacity
                  style={styles.gpsTriggerButton}
                  onPress={handleRequestGPS}
                  activeOpacity={0.7}
                  disabled={isLocating || isSearchingAddress}
                >
                  {isLocating ? (
                    <ActivityIndicator size="small" color="#0D9488" />
                  ) : (
                    <>
                      <Ionicons name="navigate-outline" size={13} color="#0D9488" />
                      <Text style={styles.gpsTriggerText}>Localizarme</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.inputWithIconWrapper}>
                <TextInput
                  style={[styles.textInput, styles.textInputWithIcon]}
                  value={location}
                  onChangeText={handleLocationTextChange}
                  onSubmitEditing={() => {
                    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
                    handleSearchAddress(location);
                  }}
                  returnKeyType="search"
                  placeholder="1629, Pilar"
                  placeholderTextColor="#9098B1"
                />
                <TouchableOpacity
                  style={styles.innerGpsIconBtn}
                  onPress={() => {
                    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
                    handleSearchAddress(location);
                  }}
                  activeOpacity={0.7}
                  disabled={isSearchingAddress}
                >
                  {isSearchingAddress ? (
                    <ActivityIndicator size="small" color="#0D9488" />
                  ) : (
                    <Ionicons name="search" size={18} color="#0D9488" />
                  )}
                </TouchableOpacity>
              </View>

              {/* Alerta si falla GPS o búsqueda */}
              {locationError && (
                <View style={styles.locationAlertBox}>
                  <Ionicons name="information-circle-outline" size={18} color="#0D9488" style={{ marginTop: 1 }} />
                  <Text style={styles.locationAlertText}>{locationError}</Text>
                </View>
              )}

              {/* Mapa Interactivo con Marker Draggable */}
              <InteractiveLocationMap
                coordinates={coordinates}
                onCoordinatesChange={handleMarkerCoordinatesChange}
                loading={isLocating || isSearchingAddress}
                loadingText={
                  isLocating
                    ? 'Obteniendo ubicación GPS...'
                    : isSearchingAddress
                    ? 'Buscando dirección en el mapa...'
                    : undefined
                }
                onRequestGPS={handleRequestGPS}
                height={195}
                borderRadius={16}
              />

              {/* Texto explicativo debajo del mapa */}
              <View style={styles.mapCaptionCard}>
                <Ionicons name="information-circle" size={16} color="#0D9488" style={{ marginTop: 1 }} />
                <Text style={styles.mapCaption}>
                  Este es el punto donde está ubicado tu perfil de Soltapp y en él aparecerán todos tus productos para los compradores cercanos.
                </Text>
              </View>

              {/* Notificación de guardado */}
              {saveMessage && (
                <View style={styles.saveNotification}>
                  <Text style={styles.saveNotificationText}>{saveMessage}</Text>
                </View>
              )}

              {/* Botón Guardar */}
              <TouchableOpacity
                style={[styles.saveButton, isSaving && styles.buttonDisabled]}
                onPress={handleSave}
                activeOpacity={0.85}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#1F232E" />
                ) : (
                  <Text style={styles.saveButtonText}>Guardar</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            /* Pestaña: Cuenta */
            <View style={styles.accountContainer}>
              {/* 1. Card: Información personal */}
              <View style={styles.personalInfoCard}>
                <Text style={styles.accountSectionTitle}>Información personal</Text>

                <Text style={styles.accountFieldLabel}>Fecha de nacimiento</Text>
                <TextInput
                  style={styles.accountInput}
                  value={birthDate}
                  onChangeText={setBirthDate}
                  placeholder="12/13/1998"
                  placeholderTextColor="#9098B1"
                />

                <Text style={[styles.accountFieldLabel, { marginTop: 14 }]}>Sexo</Text>
                <View style={styles.genderRow}>
                  <TouchableOpacity
                    style={[
                      styles.genderButton,
                      gender === 'hombre' && styles.genderButtonActive,
                    ]}
                    onPress={() => setGender('hombre')}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.genderButtonText,
                        gender === 'hombre' && styles.genderButtonTextActive,
                      ]}
                    >
                      Hombre
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.genderButton,
                      gender === 'mujer' && styles.genderButtonActive,
                    ]}
                    onPress={() => setGender('mujer')}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.genderButtonText,
                        gender === 'mujer' && styles.genderButtonTextActive,
                      ]}
                    >
                      Mujer
                    </Text>
                  </TouchableOpacity>
                </View>

                {personalSaveMessage && (
                  <View style={styles.saveNotification}>
                    <Text style={styles.saveNotificationText}>{personalSaveMessage}</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.accountSaveButton, isSavingPersonal && styles.buttonDisabled]}
                  onPress={handleSavePersonal}
                  activeOpacity={0.85}
                  disabled={isSavingPersonal}
                >
                  {isSavingPersonal ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.accountSaveButtonText}>Guardar</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* 3. Sección: Tarjetas guardadas */}
              <View style={styles.savedCardsSection}>
                <Text style={styles.savedCardsHeaderLabel}>Tarjetas guardadas</Text>
                <TouchableOpacity
                  style={styles.actionCardButton}
                  onPress={() => {
                    Alert.alert('Tarjetas guardadas', 'La gestión de tarjetas estará disponible próximamente.');
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.actionCardButtonText}>Añadir tarjeta</Text>
                </TouchableOpacity>
              </View>

              {/* 4. Card: Información cuenta */}
              <View style={styles.personalInfoCard}>
                <Text style={styles.accountSectionTitle}>Información cuenta</Text>
                <Text style={styles.accountFieldLabel}>Email</Text>
                <TextInput
                  style={[styles.accountInput, styles.accountInputReadOnly]}
                  value={currentUser?.email || 'emmanuelfacundosanchez1998@gmail.com'}
                  editable={false}
                  placeholder="Email"
                  placeholderTextColor="#9098B1"
                />
              </View>

              {/* 5. Botón Cerrar Sesión */}
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
                activeOpacity={0.8}
              >
                <Ionicons name="log-out-outline" size={18} color="#DC2626" />
                <Text style={styles.logoutButtonText}>Cerrar sesión</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {/* ========================================================= */}
        {/* 3. BARRA DE NAVEGACIÓN INFERIOR (COMPONENTE COMPARTIDO) */}
        <BottomNavbar activeTab="profile" />

        {/* Modal Categorías */}
        <CategoriesMenuModal
          visible={categoriesModalVisible}
          onClose={() => setCategoriesModalVisible(false)}
          onSelectCategory={() => setCategoriesModalVisible(false)}
        />
      </View>
    </SafeAreaView>
  );
}

const PRIMARY_COLOR = '#3BD7C2';
const TEXT_DARK = '#1F232E';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // Header Navbar
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 7,
  },
  logoWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#D8DEE6',
    borderRadius: 24,
    paddingHorizontal: 10,
    height: 44,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '400',
    color: '#1F232E',
    paddingVertical: 0,
    paddingHorizontal: 0,
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}),
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  gridIconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#D9D9D9',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  avatarCircleActive: {
    borderColor: PRIMARY_COLOR,
    borderWidth: 2,
  },
  headerAvatarImg: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#D9D9D9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },

  // Scroll Content
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 110,
  },

  // Encabezados
  headingTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: TEXT_DARK,
    marginBottom: 4,
  },
  headingSubtitle: {
    fontSize: 13.5,
    color: '#64748B',
    marginBottom: 6,
  },
  publicProfileLinkWrapper: {
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  publicProfileLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0D9488',
    textDecorationLine: 'underline',
  },

  // Segmented Control (Pills)
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 22,
    padding: 3,
    alignSelf: 'flex-start',
    marginBottom: 18,
  },
  segmentButton: {
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: 'transparent',
  },
  segmentButtonActive: {
    backgroundColor: '#1F232E',
  },
  segmentButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  segmentButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Secciones e Inputs
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: TEXT_DARK,
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
  },
  mainPhotoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 8,
  },
  avatarLoadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 39,
  },
  avatarStatusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 10,
    backgroundColor: '#F1F5F9',
  },
  avatarStatusSuccess: {
    backgroundColor: '#CCFBF1',
  },
  avatarStatusError: {
    backgroundColor: '#FFE4E6',
  },
  avatarStatusWarning: {
    backgroundColor: '#FEF3C7',
  },
  avatarStatusInfo: {
    backgroundColor: '#EFF6FF',
  },
  avatarStatusText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  mainPhotoCircle: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: '#D9D9D9',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  mainPhotoImage: {
    width: 78,
    height: 78,
    borderRadius: 39,
  },
  mainPhotoPlaceholder: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainPhotoPlaceholderText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#475569',
  },
  changePhotoButton: {
    borderWidth: 1.5,
    borderColor: '#1F232E',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  changePhotoButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F232E',
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
    color: TEXT_DARK,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}),
  },
  locationHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 0,
  },
  gpsTriggerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 8,
    backgroundColor: '#E6FAF5',
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  gpsTriggerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0D9488',
  },
  inputWithIconWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  textInputWithIcon: {
    paddingRight: 40,
  },
  innerGpsIconBtn: {
    position: 'absolute',
    right: 8,
    height: 44,
    width: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationAlertBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
  },
  locationAlertText: {
    flex: 1,
    fontSize: 12,
    color: '#0F766E',
    lineHeight: 16,
  },

  // Mapa
  mapCaptionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 12,
    marginTop: 10,
    gap: 8,
  },
  mapCaption: {
    flex: 1,
    fontSize: 12,
    color: '#0F766E',
    lineHeight: 16,
    fontWeight: '500',
  },

  // Guardado y Botón
  saveNotification: {
    backgroundColor: '#E6FAF5',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginTop: 14,
    alignSelf: 'center',
  },
  saveNotificationText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0D9488',
  },
  saveButton: {
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 25,
    height: 48,
    width: '55%',
    maxWidth: 220,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 20,
    shadowColor: PRIMARY_COLOR,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1F232E',
  },

  // Pestaña Cuenta
  accountContainer: {
    paddingTop: 4,
    paddingBottom: 24,
  },
  personalInfoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  accountSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: TEXT_DARK,
    marginBottom: 14,
  },
  accountFieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
  },
  accountInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 44,
    fontSize: 14,
    color: TEXT_DARK,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}),
  },
  accountInputReadOnly: {
    color: '#334155',
    backgroundColor: '#FAFAFA',
  },
  genderRow: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    height: 44,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderButtonActive: {
    borderColor: PRIMARY_COLOR,
    borderWidth: 2,
    backgroundColor: '#F0FDFA',
  },
  genderButtonText: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '500',
  },
  genderButtonTextActive: {
    color: '#0D9488',
    fontWeight: '700',
  },
  accountSaveButton: {
    backgroundColor: '#5CE1CD',
    borderRadius: 22,
    height: 44,
    width: '55%',
    maxWidth: 200,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    shadowColor: '#5CE1CD',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  accountSaveButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  actionCardButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  actionCardButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3BD7C2',
    textAlign: 'center',
  },
  savedCardsSection: {
    marginBottom: 0,
  },
  savedCardsHeaderLabel: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 16,
    gap: 6,
  },
  logoutButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
  },

  // Footer Navbar
  bottomNavContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
  },
  bottomNav: {
    height: 60,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  navLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9098B1',
    marginTop: 4,
  },
  navLabelActive: {
    color: '#0D9488',
    fontWeight: '700',
  },
});
