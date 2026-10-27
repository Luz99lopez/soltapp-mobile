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
import Svg, { Path, Circle } from 'react-native-svg';
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
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'vendedor' | 'comprador' | null>(null);
  const [selectedDelivery, setSelectedDelivery] = useState<'envio' | 'persona' | null>(null);
  const [showSortModal, setShowSortModal] = useState(false);
  const [selectedSort, setSelectedSort] = useState<'relevancia' | 'recientes' | 'mayor_puntuacion' | 'menor_puntuacion'>('recientes');

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

  const handleResetFilters = () => {
    setSelectedRole(null);
    setSelectedDelivery(null);
  };

  const handleApplyFilters = () => {
    setShowFilterModal(false);
  };

  const memberSinceDate = (() => {
    if (currentUser?.created_at) {
      try {
        const d = new Date(currentUser.created_at);
        const months = [
          'ene', 'feb', 'mar', 'abr', 'may', 'jun',
          'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
        ];
        return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
      } catch (_) {}
    }
    return '2 jun 2023';
  })();

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

          {/* ========================================================= */}
          {/* 4. CONTENIDO: PESTAÑA VALORACIONES (DISEÑO OFICIAL FIGMA) */}
          {/* ========================================================= */}
          {activeTab === 'valoraciones' && (
            <View style={styles.valoracionesContainer}>
              {/* Tarjeta Principal de Resumen y Acciones */}
              <View style={styles.valoracionesCard}>
                {/* 1. Resumen de Calificación y Barras de Distribución */}
                <View style={styles.ratingOverviewRow}>
                  {/* Calificación Promedio Izquierda */}
                  <View style={styles.ratingLeftCol}>
                    <View style={styles.ratingScoreRow}>
                      <Ionicons name="star" size={22} color="#1F232E" />
                      <Text style={styles.ratingScoreNumber}>5</Text>
                    </View>
                    <Text style={styles.ratingTotalCount}>(1)</Text>
                  </View>

                  {/* Barras de porcentaje por estrella Derecha */}
                  <View style={styles.ratingBarsCol}>
                    {[
                      { stars: 5, percent: 100 },
                      { stars: 4, percent: 0 },
                      { stars: 3, percent: 0 },
                      { stars: 2, percent: 0 },
                      { stars: 1, percent: 0 },
                    ].map((row) => (
                      <View key={row.stars} style={styles.breakdownRow}>
                        <Text style={styles.breakdownStarText}>{row.stars}</Text>
                        <View style={styles.breakdownTrack}>
                          {row.percent > 0 && (
                            <View
                              style={[
                                styles.breakdownFill,
                                { width: `${row.percent}%` },
                              ]}
                            />
                          )}
                        </View>
                        <Text style={styles.breakdownPercentText}>{row.percent}%</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* 2. Barra de Acciones: Filtros | Ordenar */}
                <View style={styles.filterSortRow}>
                  <TouchableOpacity
                    style={styles.filterSortButton}
                    activeOpacity={0.7}
                    onPress={() => setShowFilterModal(true)}
                  >
                    <Ionicons name="options-outline" size={18} color="#1F232E" />
                    <Text style={styles.filterSortText}>Filtros</Text>
                  </TouchableOpacity>

                  <View style={styles.filterSortDivider} />

                  <TouchableOpacity
                    style={styles.filterSortButton}
                    activeOpacity={0.7}
                    onPress={() => setShowSortModal(true)}
                  >
                    <Ionicons name="swap-vertical-outline" size={18} color="#1F232E" />
                    <Text style={styles.filterSortText}>Ordenar</Text>
                  </TouchableOpacity>
                </View>

                {/* 3. Ítem de Valoración (Detalle de la reseña con filtrado) */}
                {((selectedRole && selectedRole !== 'comprador') || (selectedDelivery && selectedDelivery !== 'persona')) ? (
                  <View style={styles.filteredEmptySection}>
                    <Ionicons name="filter-circle-outline" size={40} color="#94A3B8" />
                    <Text style={styles.filteredEmptyTitle}>No hay valoraciones</Text>
                    <Text style={styles.filteredEmptySubtitle}>
                      No se encontraron valoraciones que coincidan con los filtros seleccionados.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.reviewItemSection}>
                    {/* Encabezado: Avatar doodle y Datos del Comprador */}
                    <View style={styles.reviewerHeaderRow}>
                      <View style={styles.doodleAvatar}>
                        <View style={styles.doodleFace}>
                          <View style={styles.doodleEyesRow}>
                            <View style={styles.doodleEye} />
                            <View style={styles.doodleEye} />
                          </View>
                          <View style={styles.doodleMouth} />
                        </View>
                      </View>

                      <View style={styles.reviewerInfoCol}>
                        <Text style={styles.reviewerName}>Jose H.</Text>
                        <Text style={styles.reviewerTenure}>9 años en Soltapp</Text>
                      </View>
                    </View>

                    {/* Estrellas y Fecha */}
                    <View style={styles.reviewStarsDateRow}>
                      <View style={styles.reviewStarsGroup}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Ionicons key={s} name="star" size={15} color="#1F232E" style={{ marginRight: 2 }} />
                        ))}
                      </View>
                      <Text style={styles.reviewDateText}>Hace 3 años</Text>
                    </View>

                    {/* Tarjeta Interna de Transacción / Producto */}
                    <View style={styles.transactionCard}>
                      <View style={styles.transactionIconWrapper}>
                        <Ionicons name="bicycle-outline" size={24} color="#64748B" />
                      </View>
                      <View style={styles.transactionTextCol}>
                        <Text style={styles.transactionTypeLabel}>Compraste en persona:</Text>
                        <Text style={styles.transactionProductTitle}>Bicicletas</Text>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* ========================================================= */}
          {/* 5. CONTENIDO: PESTAÑA INFO (DISEÑO OFICIAL FIGMA)         */}
          {/* ========================================================= */}
          {activeTab === 'info' && (
            <View style={styles.infoTabContainer}>
              {/* Sección 1: Información verificada */}
              <Text style={styles.infoSectionTitle}>Información verificada</Text>

              <View style={styles.verifiedRow}>
                <Ionicons name="mail-outline" size={18} color="#475569" />
                <Text style={styles.verifiedLabel}>Email</Text>
                <Ionicons name="checkmark" size={17} color="#2DD4BF" style={styles.verifiedCheckIcon} />
              </View>

              <View style={styles.unverifiedRow}>
                <Ionicons name="call-outline" size={18} color="#94A3B8" />
                <Text style={styles.unverifiedLabel}>Número de teléfono</Text>
              </View>

              {/* Sección 2: Ratio de respuesta */}
              <Text style={styles.infoSectionTitleSpaced}>Ratio de respuesta</Text>
              <Text style={styles.infoValueText}>Desconocido</Text>

              {/* Sección 3: Miembro desde */}
              <Text style={styles.infoSectionTitleSpaced}>Miembro desde</Text>
              <Text style={styles.infoValueText}>{memberSinceDate}</Text>

              {/* Sección 4: Ubicación */}
              <Text style={styles.infoSectionTitleSpaced}>Ubicación</Text>
              <TouchableOpacity
                style={styles.mapPreviewContainer}
                activeOpacity={0.85}
                onPress={() => setShowLocationModal(true)}
              >
                {/* Pin oficial de Soltapp con carita doodle */}
                <Svg width={70} height={82} viewBox="0 0 70 82" fill="none">
                  {/* Cuerpo del Pin turquesa */}
                  <Path
                    d="M35 78 C 35 78, 12 50, 12 34 C 12 18.5 22 6 35 6 C 48 6 58 18.5 58 34 C 58 50, 35 78, 35 78 Z"
                    fill="#3BD7C2"
                    stroke="#1F232E"
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                  />
                  {/* Círculo blanco central */}
                  <Circle
                    cx="35"
                    cy="32"
                    r="17"
                    fill="#FFFFFF"
                    stroke="#1F232E"
                    strokeWidth="2.5"
                  />
                  {/* Ojo izquierdo */}
                  <Circle cx="29.5" cy="30" r="1.8" fill="#1F232E" />
                  {/* Ojo derecho */}
                  <Circle cx="40.5" cy="30" r="1.8" fill="#1F232E" />
                  {/* Sonrisa doodle */}
                  <Path
                    d="M31 35 Q 35 39.5 39 35"
                    stroke="#1F232E"
                    strokeWidth="2"
                    strokeLinecap="round"
                    fill="none"
                  />
                </Svg>

                {/* Badge con información en la esquina inferior derecha */}
                <View style={styles.mapInfoBadge}>
                  <Ionicons name="information-circle" size={22} color="#1F232E" />
                </View>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {/* ========================================================= */}
        {/* MODAL / BOTTOM SHEET DE FILTROS EN VALORACIONES          */}
        {/* ========================================================= */}
        <Modal
          visible={showFilterModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowFilterModal(false)}
        >
          <View style={styles.filterModalOverlay}>
            <TouchableOpacity
              style={styles.filterModalBackdropDismiss}
              activeOpacity={1}
              onPress={() => setShowFilterModal(false)}
            />
            <View style={styles.filterModalContent}>
              {/* Header: Cerrar, Título y Restablecer */}
              <View style={styles.filterModalHeader}>
                <View style={styles.filterModalHeaderLeft}>
                  <TouchableOpacity
                    onPress={() => setShowFilterModal(false)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={styles.filterCloseButton}
                  >
                    <Ionicons name="close" size={24} color="#1F232E" />
                  </TouchableOpacity>
                  <Text style={styles.filterModalTitle}>Filtros</Text>
                </View>

                <TouchableOpacity
                  onPress={handleResetFilters}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.filterResetButtonText}>Restablecer</Text>
                </TouchableOpacity>
              </View>

              {/* Sección 1: Rol */}
              <Text style={styles.filterGroupTitle}>Rol:</Text>
              <View style={styles.filterChipsRow}>
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    selectedRole === 'vendedor' && styles.filterChipActive,
                  ]}
                  activeOpacity={0.75}
                  onPress={() => setSelectedRole(selectedRole === 'vendedor' ? null : 'vendedor')}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedRole === 'vendedor' && styles.filterChipTextActive,
                    ]}
                  >
                    Vendedor
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    selectedRole === 'comprador' && styles.filterChipActive,
                  ]}
                  activeOpacity={0.75}
                  onPress={() => setSelectedRole(selectedRole === 'comprador' ? null : 'comprador')}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedRole === 'comprador' && styles.filterChipTextActive,
                    ]}
                  >
                    Comprador
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Sección 2: Forma de entrega */}
              <Text style={styles.filterGroupTitle}>Forma de entrega:</Text>
              <View style={styles.filterChipsRow}>
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    selectedDelivery === 'envio' && styles.filterChipActive,
                  ]}
                  activeOpacity={0.75}
                  onPress={() => setSelectedDelivery(selectedDelivery === 'envio' ? null : 'envio')}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedDelivery === 'envio' && styles.filterChipTextActive,
                    ]}
                  >
                    Envío
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    selectedDelivery === 'persona' && styles.filterChipActive,
                  ]}
                  activeOpacity={0.75}
                  onPress={() => setSelectedDelivery(selectedDelivery === 'persona' ? null : 'persona')}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedDelivery === 'persona' && styles.filterChipTextActive,
                    ]}
                  >
                    En persona
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Botón inferior: Mostrar resultados */}
              <TouchableOpacity
                style={[
                  styles.filterApplyButton,
                  (selectedRole !== null || selectedDelivery !== null) && styles.filterApplyButtonActive,
                ]}
                activeOpacity={0.8}
                onPress={handleApplyFilters}
              >
                <Text
                  style={[
                    styles.filterApplyButtonText,
                    (selectedRole !== null || selectedDelivery !== null) && styles.filterApplyButtonTextActive,
                  ]}
                >
                  Mostrar resultados
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ========================================================= */}
        {/* MODAL / BOTTOM SHEET DE ORDENAR EN VALORACIONES           */}
        {/* ========================================================= */}
        <Modal
          visible={showSortModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowSortModal(false)}
        >
          <View style={styles.filterModalOverlay}>
            <TouchableOpacity
              style={styles.filterModalBackdropDismiss}
              activeOpacity={1}
              onPress={() => setShowSortModal(false)}
            />
            <View style={styles.sortModalContent}>
              {/* Título: Sort by: */}
              <Text style={styles.sortModalTitle}>Sort by:</Text>

              {/* Lista de opciones de ordenamiento con Radio Buttons */}
              {[
                { id: 'relevancia', label: 'Relevancia' },
                { id: 'recientes', label: 'Más recientes' },
                { id: 'mayor_puntuacion', label: 'Mayor puntuación' },
                { id: 'menor_puntuacion', label: 'Menor puntuación' },
              ].map((option) => {
                const isSelected = selectedSort === option.id;
                return (
                  <TouchableOpacity
                    key={option.id}
                    style={styles.sortOptionRow}
                    activeOpacity={0.7}
                    onPress={() => {
                      setSelectedSort(option.id as any);
                      setTimeout(() => setShowSortModal(false), 200);
                    }}
                  >
                    <Text
                      style={[
                        styles.sortOptionLabel,
                        isSelected && styles.sortOptionLabelSelected,
                      ]}
                    >
                      {option.label}
                    </Text>

                    {/* Radio Button Circular */}
                    <View
                      style={[
                        styles.radioOuter,
                        isSelected && styles.radioOuterSelected,
                      ]}
                    >
                      {isSelected && <View style={styles.radioInner} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </Modal>

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
    width: 65,
    height: 2.5,
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 2,
    alignSelf: 'center',
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

  // Contenido: Valoraciones (Diseño Oficial de la Maqueta)
  valoracionesContainer: {
    marginHorizontal: 16,
    marginTop: 14,
  },
  valoracionesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  ratingOverviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 16,
  },
  ratingLeftCol: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 16,
    minWidth: 70,
  },
  ratingScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingScoreNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1F232E',
    marginLeft: 6,
    lineHeight: 36,
  },
  ratingTotalCount: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  ratingBarsCol: {
    flex: 1,
    paddingLeft: 4,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  breakdownStarText: {
    fontSize: 12,
    color: '#64748B',
    width: 12,
    textAlign: 'right',
  },
  breakdownTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  breakdownFill: {
    height: '100%',
    backgroundColor: '#1F232E',
    borderRadius: 3,
  },
  breakdownPercentText: {
    fontSize: 12,
    color: '#64748B',
    width: 36,
    textAlign: 'right',
  },
  filterSortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  filterSortButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  filterSortText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#1F232E',
    marginLeft: 8,
  },
  filterSortDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
  reviewItemSection: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  reviewerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  doodleAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF2F6',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  doodleFace: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  doodleEyesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  doodleEye: {
    width: 3.5,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: '#64748B',
  },
  doodleMouth: {
    width: 8,
    height: 1.5,
    borderRadius: 1,
    backgroundColor: '#64748B',
  },
  reviewerInfoCol: {
    flex: 1,
  },
  reviewerName: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#1F232E',
  },
  reviewerTenure: {
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 2,
  },
  reviewStarsDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewStarsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewDateText: {
    fontSize: 12.5,
    color: '#64748B',
    marginLeft: 8,
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
  },
  transactionIconWrapper: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  transactionTextCol: {
    flex: 1,
  },
  transactionTypeLabel: {
    fontSize: 12.5,
    color: '#64748B',
  },
  transactionProductTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#1F232E',
    marginTop: 2,
  },

  // Contenido: Info (Diseño Oficial de la Maqueta)
  infoTabContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  infoSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F232E',
  },
  infoSectionTitleSpaced: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F232E',
    marginTop: 20,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  verifiedLabel: {
    fontSize: 14.5,
    color: '#475569',
    marginLeft: 8,
  },
  verifiedCheckIcon: {
    marginLeft: 8,
  },
  unverifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  unverifiedLabel: {
    fontSize: 14.5,
    color: '#94A3B8',
    marginLeft: 8,
  },
  infoValueText: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 5,
  },
  mapPreviewContainer: {
    marginTop: 10,
    height: 165,
    borderRadius: 12,
    backgroundColor: '#A0D2FB',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  mapInfoBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 11,
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  // Modal / Bottom Sheet de Filtros (Exacto al diseño)
  filterModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  filterModalBackdropDismiss: {
    flex: 1,
  },
  filterModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  filterModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  filterModalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterCloseButton: {
    padding: 2,
  },
  filterModalTitle: {
    fontSize: 16.5,
    fontWeight: '700',
    color: '#1F232E',
    marginLeft: 14,
  },
  filterResetButtonText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0D9488',
  },
  filterGroupTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#1F232E',
    marginTop: 20,
    marginBottom: 10,
  },
  filterChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  filterChipActive: {
    backgroundColor: '#1F232E',
    borderColor: '#1F232E',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#475569',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  filterApplyButton: {
    marginTop: 30,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#A1EFE3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterApplyButtonActive: {
    backgroundColor: '#3BD7C2',
  },
  filterApplyButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0D9488',
  },
  filterApplyButtonTextActive: {
    color: '#1F232E',
  },
  filteredEmptySection: {
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filteredEmptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F232E',
    marginTop: 10,
  },
  filteredEmptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  // Modal de Ordenar (Exacto al diseño)
  sortModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  sortModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F232E',
    marginBottom: 8,
  },
  sortOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
  },
  sortOptionLabel: {
    fontSize: 15,
    color: '#475569',
    fontWeight: '500',
  },
  sortOptionLabelSelected: {
    color: '#1F232E',
    fontWeight: '600',
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: '#1F232E',
    borderWidth: 2.5,
    backgroundColor: '#FFFFFF',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1F232E',
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
