import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../supabase';
import CategoriesMenuModal from '../components/CategoriesMenuModal';

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

  // Campos de Información pública editables
  const [firstName, setFirstName] = useState('Manuel');
  const [lastName, setLastName] = useState('Sans');
  const [location, setLocation] = useState('1629, Pilar');
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
    if (meta.location) setLocation(meta.location);
  };

  const userAvatar =
    currentUser?.user_metadata?.avatar_url ||
    currentUser?.user_metadata?.picture ||
    null;

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setSaveMessage(null);
      const fullNameCombined = `${firstName.trim()} ${lastName.trim()}`.trim();
      const { data, error } = await supabase.auth.updateUser({
        data: {
          full_name: fullNameCombined,
          name: fullNameCombined,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          location: location.trim(),
        },
      });

      if (error) {
        setSaveMessage('Error al guardar los cambios.');
      } else {
        if (data?.user) {
          setCurrentUser(data.user);
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
    router.push({ pathname: '/home', params: { openTuMenu: 'true' } } as any);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.container}>
        {/* ========================================================= */}
        {/* 1. HEADER NAVBAR SUPERIOR OFICIAL                         */}
        {/* ========================================================= */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.logoWrapper}
            activeOpacity={0.8}
            onPress={() => router.push('/home' as any)}
          >
            <IsotipoConFondo width={38} height={38} />
          </TouchableOpacity>

          <View style={styles.searchBar}>
            <BuscarIcon width={18} height={18} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar en todas las categorías"
              placeholderTextColor="#1F232E"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Feather name="x" size={15} color="#9098B1" />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.gridIconButton}
              onPress={() => setCategoriesModalVisible(true)}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <VerTodoIcon width={24} height={24} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.avatarCircle, styles.avatarCircleActive]}
              onPress={goToPublicProfile}
              activeOpacity={0.7}
            >
              {userAvatar ? (
                <Image source={{ uri: userAvatar }} style={styles.headerAvatarImg} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitial}>
                    {firstName.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

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
              {/* Sección: Imágenes de perfil */}
              <Text style={styles.sectionTitle}>Imágenes de perfil</Text>

              {/* Foto principal */}
              <Text style={styles.fieldLabel}>Foto principal</Text>
              <View style={styles.mainPhotoRow}>
                <View style={styles.mainPhotoCircle}>
                  {userAvatar ? (
                    <Image source={{ uri: userAvatar }} style={styles.mainPhotoImage} />
                  ) : (
                    <View style={styles.mainPhotoPlaceholder}>
                      <Text style={styles.mainPhotoPlaceholderText}>
                        {firstName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity style={styles.changePhotoButton} activeOpacity={0.75}>
                  <Text style={styles.changePhotoButtonText}>Cambiar foto</Text>
                </TouchableOpacity>
              </View>

              {/* Foto de portada */}
              <Text style={[styles.fieldLabel, { marginTop: 18 }]}>Foto de portada</Text>
              <View style={styles.coverPhotoBox}>
                <Ionicons name="image-outline" size={28} color="#94A3B8" />
              </View>

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

              {/* Input: Ubicación de tus productos */}
              <Text style={[styles.fieldLabel, { marginTop: 14 }]}>
                Ubicación de tus productos
              </Text>
              <TextInput
                style={styles.textInput}
                value={location}
                onChangeText={setLocation}
                placeholder="1629, Pilar"
                placeholderTextColor="#9098B1"
              />

              {/* Tarjeta de Mapa con Pin */}
              <View style={styles.mapCard}>
                <Image
                  source={{
                    uri: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&q=80',
                  }}
                  style={styles.mapImage}
                />
                <View style={styles.mapPinContainer}>
                  <Ionicons name="location-sharp" size={34} color="#EF4444" />
                </View>
              </View>

              {/* Texto explicativo debajo del mapa */}
              <Text style={styles.mapCaption}>
                Este es el punto donde está ubicado tu perfil de Soltapp y en él aparecerán todos tus productos.
              </Text>

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
              <Text style={styles.sectionTitle}>Datos de tu cuenta</Text>

              <View style={styles.accountCard}>
                <Text style={styles.accountLabel}>Correo Electrónico</Text>
                <Text style={styles.accountValue}>
                  {currentUser?.email || 'No disponible'}
                </Text>
              </View>

              <View style={styles.accountCard}>
                <Text style={styles.accountLabel}>ID de Usuario</Text>
                <Text style={styles.accountValue} numberOfLines={1}>
                  {currentUser?.id || 'ID'}
                </Text>
              </View>

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
        {/* 3. BARRA DE NAVEGACIÓN INFERIOR (Footer Navbar)           */}
        {/* ========================================================= */}
        <View style={styles.bottomNavContainer}>
          <View style={styles.bottomNav}>
            {/* Inicio */}
            <TouchableOpacity
              style={styles.navItem}
              onPress={() => router.push('/home' as any)}
              activeOpacity={0.7}
            >
              <HomeIcon width={24} height={24} stroke="#9098B1" />
              <Text style={styles.navLabel}>Inicio</Text>
            </TouchableOpacity>

            {/* Favoritos */}
            <TouchableOpacity
              style={styles.navItem}
              onPress={() => router.push('/home' as any)}
              activeOpacity={0.7}
            >
              <CorazonIcon width={24} height={24} fill="#9098B1" />
              <Text style={styles.navLabel}>Favoritos</Text>
            </TouchableOpacity>

            {/* Subir */}
            <TouchableOpacity
              style={styles.navItem}
              onPress={() => router.push('/home' as any)}
              activeOpacity={0.7}
            >
              <MasIcon width={24} height={24} stroke="#9098B1" />
              <Text style={styles.navLabel}>Subir</Text>
            </TouchableOpacity>

            {/* Buzón */}
            <TouchableOpacity
              style={styles.navItem}
              onPress={() => router.push('/home?tab=inbox' as any)}
              activeOpacity={0.7}
            >
              <MailIcon width={24} height={24} stroke="#9098B1" />
              <Text style={styles.navLabel}>Buzón</Text>
            </TouchableOpacity>

            {/* Perfil (Activo) */}
            <TouchableOpacity
              style={styles.navItem}
              onPress={goToPublicProfile}
              activeOpacity={0.7}
            >
              <AvatarIcon width={24} height={24} fill={PRIMARY_COLOR} />
              <Text style={[styles.navLabel, styles.navLabelActive]}>Perfil</Text>
            </TouchableOpacity>
          </View>
        </View>

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
  coverPhotoBox: {
    width: '100%',
    height: 125,
    backgroundColor: '#D9D9D9',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
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

  // Mapa
  mapCard: {
    width: '100%',
    height: 140,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 14,
    position: 'relative',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  mapImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  mapPinContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -17 }, { translateY: -30 }],
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapCaption: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
    marginTop: 10,
    textAlign: 'center',
    paddingHorizontal: 10,
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
    paddingTop: 10,
  },
  accountCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  accountLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9098B1',
    marginBottom: 4,
  },
  accountValue: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_DARK,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 14,
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
