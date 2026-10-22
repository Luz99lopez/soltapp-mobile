import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image,
  TextInput,
  Platform,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../supabase';
import CategoriesMenuModal from '../components/CategoriesMenuModal';
import EmptyShelfIllustration from '../components/EmptyShelfIllustration';
import BottomNavbar from '../components/BottomNavbar';
import TopNavbar from '../components/TopNavbar';
import InteractiveLocationMap, { LocationCoordinates, DEFAULT_COORDINATES } from '../components/InteractiveLocationMap';


const PRIMARY_COLOR = '#3BD7C2';
const TEXT_DARK = '#1F232E';

export default function PublicProfileScreen() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'en_venta' | 'valoraciones' | 'info'>('en_venta');
  const [categoriesModalVisible, setCategoriesModalVisible] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);

  // Datos del perfil público
  const [displayName, setDisplayName] = useState('Emmanuel S.');
  const [locationText, setLocationText] = useState('1629, Pilar');
  const [coordinates, setCoordinates] = useState<LocationCoordinates>(DEFAULT_COORDINATES);
  const [userProducts, setUserProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setCurrentUser(user);
        extractProfileData(user);
        loadUserProducts(user.id);
      } else {
        setLoadingProducts(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
      if (session?.user) {
        extractProfileData(session.user);
        loadUserProducts(session.user.id);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const extractProfileData = (user: any) => {
    const meta = user?.user_metadata || {};
    const fullName = meta.full_name || meta.name || '';
    if (fullName) {
      const parts = fullName.trim().split(' ');
      if (parts.length > 1) {
        setDisplayName(`${parts[0]} ${parts[1].charAt(0).toUpperCase()}.`);
      } else {
        setDisplayName(fullName);
      }
    } else if (meta.first_name) {
      setDisplayName(`${meta.first_name} ${meta.last_name ? meta.last_name.charAt(0).toUpperCase() + '.' : ''}`.trim());
    }

    if (meta.ubicacion_texto) {
      setLocationText(meta.ubicacion_texto);
    } else if (meta.location) {
      setLocationText(meta.location);
    }

    if (meta.latitud && meta.longitud) {
      setCoordinates({
        latitude: Number(meta.latitud),
        longitude: Number(meta.longitud),
      });
    }
  };

  const loadUserProducts = async (userId: string) => {
    try {
      setLoadingProducts(true);
      const { data, error } = await supabase
        .from('products')
        .select('*, product_images(*)')
        .eq('seller_id', userId)
        .eq('status', 'activo');

      if (!error && data) {
        setUserProducts(data);
      }
    } catch (_) {
      // Ignorar silenciosamente si no hay productos
    } finally {
      setLoadingProducts(false);
    }
  };

  const userAvatar =
    currentUser?.user_metadata?.avatar_url ||
    currentUser?.user_metadata?.picture ||
    null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.container}>
        {/* ========================================================= */}
        {/* 1. HEADER NAVBAR SUPERIOR OFICIAL (COMPARTIDO)           */}
        {/* ========================================================= */}
        <TopNavbar activeScreen="public-profile" onOpenCategories={() => setCategoriesModalVisible(true)} userAvatar={userAvatar} />

        {/* ========================================================= */}
        {/* 2. CONTENIDO PRINCIPAL SCROLLABLE                         */}
        {/* ========================================================= */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Tarjeta de perfil público */}
          <View style={styles.profileCard}>
            <View style={styles.profileAvatarWrapper}>
              {userAvatar ? (
                <Image source={{ uri: userAvatar }} style={styles.profileAvatarImg} />
              ) : (
                <View style={styles.profileAvatarFallback}>
                  <Text style={styles.profileAvatarFallbackText}>
                    {displayName.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.profileInfoColumn}>
              {/* Nombre de usuario */}
              <Text style={styles.profileName} numberOfLines={1}>
                {displayName}
              </Text>

              {/* Valoración en estrellas */}
              <View style={styles.ratingRow}>
                <View style={styles.starsGroup}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons key={star} name="star" size={14} color="#1F232E" />
                  ))}
                </View>
                <Text style={styles.ratingText}>5 (1)</Text>
              </View>

              {/* Métricas: Ventas y Compras */}
              <View style={styles.statsRow}>
                <Ionicons name="bar-chart" size={14} color="#F43F5E" style={{ marginRight: 4 }} />
                <Text style={styles.statNumber}>0</Text>
                <Text style={styles.statLabel}>Ventas</Text>

                <View style={styles.statDivider} />

                <Text style={styles.statNumber}>1</Text>
                <Text style={styles.statLabel}>Compra</Text>
              </View>

              {/* Ubicación del usuario */}
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={15} color="#475569" style={{ marginRight: 4 }} />
                <Text style={styles.locationText} numberOfLines={1}>
                  {locationText}
                </Text>
                <TouchableOpacity
                  onPress={() => setShowLocationModal(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.viewLocationLink}>Ver ubicación</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* ========================================================= */}
          {/* 3. PESTAÑAS (EN VENTA, VALORACIONES, INFO)                */}
          {/* ========================================================= */}
          <View style={styles.tabsContainer}>
            {/* Pestaña: En venta */}
            <TouchableOpacity
              style={styles.tabButton}
              onPress={() => setActiveTab('en_venta')}
              activeOpacity={0.75}
            >
              <Text style={styles.tabNumber}>{userProducts.length}</Text>
              <Text style={[styles.tabLabel, activeTab === 'en_venta' && styles.tabLabelActive]}>
                En venta
              </Text>
              {activeTab === 'en_venta' && <View style={styles.activeIndicator} />}
            </TouchableOpacity>

            {/* Pestaña: Valoraciones */}
            <TouchableOpacity
              style={styles.tabButton}
              onPress={() => setActiveTab('valoraciones')}
              activeOpacity={0.75}
            >
              <Text style={styles.tabNumber}>1</Text>
              <Text style={[styles.tabLabel, activeTab === 'valoraciones' && styles.tabLabelActive]}>
                Valoraciones
              </Text>
              {activeTab === 'valoraciones' && <View style={styles.activeIndicator} />}
            </TouchableOpacity>

            {/* Pestaña: Info */}
            <TouchableOpacity
              style={styles.tabButton}
              onPress={() => setActiveTab('info')}
              activeOpacity={0.75}
            >
              <Text style={styles.tabNumber}>+</Text>
              <Text style={[styles.tabLabel, activeTab === 'info' && styles.tabLabelActive]}>
                Info
              </Text>
              {activeTab === 'info' && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          </View>

          {/* ========================================================= */}
          {/* 4. CONTENIDO DE LAS PESTAÑAS                              */}
          {/* ========================================================= */}
          {activeTab === 'en_venta' && (
            <View style={styles.enVentaCard}>
              {loadingProducts ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={PRIMARY_COLOR} />
                  <Text style={styles.loadingText}>Cargando productos...</Text>
                </View>
              ) : userProducts.length === 0 ? (
                /* Estado Vacío Oficial con Ilustración */
                <View style={styles.emptyStateContainer}>
                  <EmptyShelfIllustration width={260} height={170} />

                  <Text style={styles.emptyTitle}>Nada en venta todavía</Text>
                  <Text style={styles.emptyDescription}>
                    Al parecer, alguien usa todo lo que tiene. ¡Dale tiempo para subir algo a Soltapp!
                  </Text>
                </View>
              ) : (
                /* Lista de productos del usuario */
                <View style={styles.productsGrid}>
                  {userProducts.map((prod) => (
                    <TouchableOpacity
                      key={prod.id}
                      style={styles.productCard}
                      onPress={() => router.push(`/product/${prod.id}` as any)}
                      activeOpacity={0.8}
                    >
                      <Image
                        source={{
                          uri:
                            prod.product_images?.[0]?.image_url ||
                            'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80',
                        }}
                        style={styles.productImage}
                      />
                      <Text style={styles.productPrice}>${prod.price}</Text>
                      <Text style={styles.productTitle} numberOfLines={1}>
                        {prod.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          {activeTab === 'valoraciones' && (
            <View style={styles.reviewsContainer}>
              <View style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewAvatar}>
                    <Text style={styles.reviewAvatarText}>M</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reviewerName}>Marcos D.</Text>
                    <View style={styles.starsGroup}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Ionicons key={s} name="star" size={12} color="#1F232E" />
                      ))}
                    </View>
                  </View>
                  <Text style={styles.reviewDate}>Hace 3 días</Text>
                </View>
                <Text style={styles.reviewComment}>
                  Excelente usuario, comunicación súper fluida y trato impecable. 100% recomendable.
                </Text>
              </View>
            </View>
          )}

          {activeTab === 'info' && (
            <View style={styles.infoTabContainer}>
              <View style={styles.infoItemRow}>
                <Ionicons name="calendar-outline" size={20} color="#0D9488" />
                <View style={{ marginLeft: 12 }}>
                  <Text style={styles.infoItemTitle}>Miembro en Soltapp</Text>
                  <Text style={styles.infoItemSubtitle}>Desde Octubre 2026</Text>
                </View>
              </View>

              <View style={styles.infoItemRow}>
                <Ionicons name="shield-checkmark-outline" size={20} color="#0D9488" />
                <View style={{ marginLeft: 12 }}>
                  <Text style={styles.infoItemTitle}>Verificaciones</Text>
                  <Text style={styles.infoItemSubtitle}>Email y teléfono confirmados</Text>
                </View>
              </View>

              <View style={styles.infoItemRow}>
                <Ionicons name="time-outline" size={20} color="#0D9488" />
                <View style={{ marginLeft: 12 }}>
                  <Text style={styles.infoItemTitle}>Tiempo de respuesta</Text>
                  <Text style={styles.infoItemSubtitle}>Suele responder en unas horas</Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* ========================================================= */}
        {/* 5. MODAL DE UBICACIÓN INTERACTIVA                        */}
        {/* ========================================================= */}
        <Modal
          visible={showLocationModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowLocationModal(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Ubicación pública</Text>
                <TouchableOpacity
                  onPress={() => setShowLocationModal(false)}
                  style={styles.modalCloseButton}
                >
                  <Ionicons name="close" size={20} color="#1F232E" />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSubtitle}>{locationText}</Text>

              <InteractiveLocationMap
                coordinates={coordinates}
                onCoordinatesChange={() => {}}
                height={200}
                borderRadius={14}
              />

              <TouchableOpacity
                style={styles.modalDoneButton}
                onPress={() => setShowLocationModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalDoneButtonText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ========================================================= */}
        {/* 6. BARRA DE NAVEGACIÓN INFERIOR (COMPONENTE COMPARTIDO) */}
        <BottomNavbar activeTab="profile" />

        {/* Modal de Categorías */}
        <CategoriesMenuModal
          visible={categoriesModalVisible}
          onClose={() => setCategoriesModalVisible(false)}
          onSelectCategory={() => setCategoriesModalVisible(false)}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  // ScrollView
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 90,
  },

  // Tarjeta de Perfil
  profileCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    alignItems: 'center',
  },
  profileAvatarWrapper: {
    marginRight: 14,
  },
  profileAvatarImg: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  profileAvatarFallback: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarFallbackText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#475569',
  },
  profileInfoColumn: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '800',
    color: TEXT_DARK,
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  starsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: TEXT_DARK,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  statNumber: {
    fontSize: 13,
    fontWeight: '800',
    color: TEXT_DARK,
    marginRight: 3,
  },
  statLabel: {
    fontSize: 13,
    color: '#475569',
    marginRight: 8,
  },
  statDivider: {
    width: 1,
    height: 12,
    backgroundColor: '#CBD5E1',
    marginRight: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  locationText: {
    fontSize: 12.5,
    color: '#475569',
    fontWeight: '500',
  },
  viewLocationLink: {
    fontSize: 12.5,
    color: '#0D9488',
    fontWeight: '600',
    textDecorationLine: 'underline',
    marginLeft: 6,
  },

  // Pestañas
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginTop: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    position: 'relative',
  },
  tabNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: TEXT_DARK,
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#64748B',
  },
  tabLabelActive: {
    color: TEXT_DARK,
    fontWeight: '700',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 2.5,
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 2,
  },

  // Contenido: En venta
  enVentaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 14,
    padding: 24,
    minHeight: 340,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: TEXT_DARK,
    marginTop: 18,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 13.5,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
    paddingHorizontal: 20,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    width: '100%',
  },
  productCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  productImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 6,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: TEXT_DARK,
  },
  productTitle: {
    fontSize: 12,
    color: '#64748B',
  },

  // Contenido: Valoraciones
  reviewsContainer: {
    marginHorizontal: 16,
    marginTop: 14,
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 10,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  reviewAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_DARK,
    marginBottom: 2,
  },
  reviewDate: {
    fontSize: 12,
    color: '#94A3B8',
  },
  reviewComment: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },

  // Contenido: Info
  infoTabContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 16,
  },
  infoItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_DARK,
  },
  infoItemSubtitle: {
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 2,
  },

  // Modal de Ubicación
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: TEXT_DARK,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 14,
  },
  modalDoneButton: {
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 22,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  modalDoneButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

});
