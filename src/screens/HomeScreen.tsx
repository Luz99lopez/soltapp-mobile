import React, { useState, useEffect, useCallback } from 'react';
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
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../supabase';
import { fetchHomeProducts, ProductListItem } from '../services';
import CategoriesMenuModal, { CategoryItem } from '../components/CategoriesMenuModal';
import InboxView from '../components/InboxView';

// Componentes SVG oficiales de Soltapp desde assets/svgs
import IsotipoConFondo from '../../assets/svgs/isotipo con fondo.svg';
import BuscarIcon from '../../assets/svgs/Buscar.svg';
import VerTodoIcon from '../../assets/svgs/Ver todo.svg';
import AvatarIcon from '../../assets/svgs/Avatar.svg';
import AutoIcon from '../../assets/svgs/Auto.svg';
import MotoIcon from '../../assets/svgs/Moto.svg';
import InmobiliariaIcon from '../../assets/svgs/Inmobiliaria.svg';
import ModaIcon from '../../assets/svgs/Moda y accesorios.svg';
import MotorIcon from '../../assets/svgs/Motor y accesorios.svg';
import HomeIcon from '../../assets/svgs/Home.svg';
import CorazonIcon from '../../assets/svgs/Corazón.svg';
import MasIcon from '../../assets/svgs/Más.svg';
import MailIcon from '../../assets/svgs/mail.svg';

// SVGs de Perfil
import ProductoIcon from '../../assets/svgs/Producto.svg';
import ComprasIcon from '../../assets/svgs/Compras.svg';
import VentasIcon from '../../assets/svgs/Ventas.svg';
import BilleteraIcon from '../../assets/svgs/Billetara.svg';
import ConfiguracionIcon from '../../assets/svgs/Configuracion.svg';
import PreguntaIcon from '../../assets/svgs/Pregunta.svg';
import SiguienteIcon from '../../assets/svgs/Siguiente.svg';
import EstrellaIcon from '../../assets/svgs/Estrella.svg';

// Datos de Categorías con sus respectivos SVGs (Exacto al diseño y orden de Figma)
const CATEGORIES = [
  { id: '1', name: 'Autos', IconComponent: AutoIcon },
  { id: '2', name: 'Motos', IconComponent: MotoIcon },
  { id: '3', name: 'Motor y\naccesorios', IconComponent: MotorIcon },
  { id: '4', name: 'Moda y\naccesorios', IconComponent: ModaIcon },
  { id: '5', name: 'Inmobilia\nria', IconComponent: InmobiliariaIcon },
];

const DEFAULT_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=500&q=80';

export default function HomeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'home' | 'favorites' | 'upload' | 'inbox' | 'profile'>('home');

  // Estado dinámico de publicaciones desde Supabase
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(true);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Carga de productos reales de Supabase
  const loadProducts = useCallback(async () => {
    try {
      setProductsError(null);
      const data = await fetchHomeProducts();
      setProducts(data);
    } catch (err: any) {
      console.error('[HomeScreen.loadProducts] Error:', err);
      setProductsError(err.message || 'Error al cargar productos.');
    } finally {
      setLoadingProducts(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    if (params?.tab === 'inbox') {
      setActiveTab('inbox');
    }
  }, [params?.tab]);
  const [profileSubView, setProfileSubView] = useState<'edit' | 'public'>('edit');
  const [editTab, setEditTab] = useState<'perfil' | 'cuenta'>('perfil');

  // Campos editables de perfil
  const [editFirstName, setEditFirstName] = useState('Manuel');
  const [editLastName, setEditLastName] = useState('Sans');
  const [editLocation, setEditLocation] = useState('1629, Pilar');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Helper de formateo de precio según la moneda (ARS / USD)
  const formatProductPrice = (price: number | string, currency: string = 'ARS') => {
    const numericPrice = Number(price) || 0;
    const formatted = numericPrice.toLocaleString('es-AR');
    return currency?.toUpperCase() === 'USD' ? `USD ${formatted}` : `$ ${formatted}`;
  };

  // Helper para obtener imagen de portada con fallback
  const getProductCoverImage = (prod: ProductListItem) => {
    if (prod.cover_image) return prod.cover_image;
    if (prod.images && prod.images.length > 0) {
      const cover = prod.images.find((img) => img.is_cover);
      return cover ? cover.image_url : prod.images[0].image_url;
    }
    return DEFAULT_FALLBACK_IMAGE;
  };

  // Filtrado de publicaciones por barra de búsqueda
  const filteredProducts = products.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      p.title.toLowerCase().includes(q) ||
      (p.location && p.location.toLowerCase().includes(q)) ||
      (p.category?.name && p.category.name.toLowerCase().includes(q))
    );
  });

  const nearbyProducts = filteredProducts.slice(0, 4);
  const recentProducts = filteredProducts.length > 4 ? filteredProducts.slice(4) : filteredProducts;

  const [favorites, setFavorites] = useState<string[]>([]);
  const [categoriesModalVisible, setCategoriesModalVisible] = useState<boolean>(false);

  const handleProductPress = (productId: string) => {
    router.push({
      pathname: '/modal',
      params: { productId },
    } as any);
  };

  useEffect(() => {
    // Manejo de intercambio de código OAuth (PKCE) en navegador web móvil o desktop
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const code = searchParams.get('code');
      if (code) {
        supabase.auth.exchangeCodeForSession(code).then(({ data, error }) => {
          if (data?.user) {
            setCurrentUser(data.user);
            loadUserData(data.user);
          }
        });
      }
    }

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setCurrentUser(user);
        loadUserData(user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
      if (session?.user) {
        loadUserData(session.user);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadUserData = (user: any) => {
    const meta = user?.user_metadata || {};
    const fullName = meta.full_name || meta.name || '';
    if (fullName) {
      const parts = fullName.trim().split(' ');
      if (parts.length > 1) {
        setEditFirstName(parts[0]);
        setEditLastName(parts.slice(1).join(' '));
      } else {
        setEditFirstName(fullName);
      }
    }
    if (meta.first_name) setEditFirstName(meta.first_name);
    if (meta.last_name) setEditLastName(meta.last_name);
    if (meta.location) setEditLocation(meta.location);
  };

  const userName =
    currentUser?.user_metadata?.full_name ||
    currentUser?.user_metadata?.name ||
    `${editFirstName} ${editLastName}`.trim() ||
    (currentUser?.email ? currentUser.email.split('@')[0] : 'Manuel Sans');

  const userAvatar =
    currentUser?.user_metadata?.avatar_url ||
    currentUser?.user_metadata?.picture ||
    null;

  const userYear = currentUser?.created_at
    ? new Date(currentUser.created_at).getFullYear()
    : '2026';

  const toggleFavorite = (id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/login' as any);
  };

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      setSaveMessage(null);
      const fullNameCombined = `${editFirstName.trim()} ${editLastName.trim()}`.trim();
      const { data, error } = await supabase.auth.updateUser({
        data: {
          full_name: fullNameCombined,
          name: fullNameCombined,
          first_name: editFirstName.trim(),
          last_name: editLastName.trim(),
          location: editLocation.trim(),
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.container}>
        {/* ========================================================= */}
        {/* 1. HEADER NAVBAR SUPERIOR (Exacto al diseño de referencia) */}
        {/* ========================================================= */}
        <View style={styles.header}>
          {/* Isotipo con fondo turquesa oficial */}
          <TouchableOpacity
            style={styles.logoWrapper}
            activeOpacity={0.8}
            onPress={() => setActiveTab('home')}
          >
            <IsotipoConFondo width={38} height={38} />
          </TouchableOpacity>

          {/* Barra de búsqueda píldora con borde gris */}
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

          {/* Acciones a la derecha: Icono de Grilla/Ver todo 2x2 + Avatar circular */}
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
              style={[
                styles.avatarCircle,
                activeTab === 'profile' && styles.avatarCircleActive,
              ]}
              onPress={() => {
                if (activeTab === 'profile') {
                  // Si ya está en el menú "Tú", ir a la pantalla de Perfil completa
                  router.push('/profile' as any);
                } else {
                  // Abrir el menú "Tú"
                  setActiveTab('profile');
                }
              }}
              activeOpacity={0.7}
            >
              {userAvatar ? (
                <Image source={{ uri: userAvatar }} style={styles.headerAvatarImg} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitial}>
                    {userName.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* ========================================================= */}
        {/* 2. CONTENIDO PRINCIPAL: FEED HOME vs MENÚ "TÚ"            */}
        {/* ========================================================= */}
        {activeTab === 'profile' ? (
          /* ========================================================= */
          /* MENÚ DESPLEGABLE / VISTA "TÚ" (Figma Referencia 1)       */
          /* ========================================================= */
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.tuMenuScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Cabecera Principal del Usuario en "Tú" */}
            <TouchableOpacity
              style={styles.tuHeaderCard}
              onPress={() => router.push('/profile' as any)}
              activeOpacity={0.8}
            >
              <View style={styles.tuAvatarWrapper}>
                {userAvatar ? (
                  <Image source={{ uri: userAvatar }} style={styles.tuAvatarImage} />
                ) : (
                  <View style={styles.tuAvatarDefault}>
                    <Text style={styles.tuAvatarDefaultText}>
                      {userName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.tuUserInfoCol}>
                <Text style={styles.tuUserName}>{userName}</Text>

                {/* 5 Estrellas Negras de Calificación */}
                <View style={styles.tuRatingRow}>
                  <EstrellaIcon width={16} height={16} />
                  <EstrellaIcon width={16} height={16} />
                  <EstrellaIcon width={16} height={16} />
                  <EstrellaIcon width={16} height={16} />
                  <EstrellaIcon width={16} height={16} />
                  <Text style={styles.tuRatingCount}>(1)</Text>
                </View>

                <Text style={styles.tuMemberSince}>En soltapp desde {userYear}</Text>
              </View>

              {/* Flecha principal de navegación a Perfil */}
              <View style={styles.tuHeaderArrow}>
                <SiguienteIcon width={18} height={18} />
              </View>
            </TouchableOpacity>

            {/* SECCIÓN: CATÁLOGO */}
            <View style={styles.tuSection}>
              <Text style={styles.tuSectionTitle}>CATÁLOGO</Text>
              <TouchableOpacity style={styles.tuMenuItem} activeOpacity={0.7}>
                <View style={styles.tuMenuItemLeft}>
                  <ProductoIcon width={22} height={22} />
                  <Text style={styles.tuMenuItemText}>Productos</Text>
                </View>
                <SiguienteIcon width={14} height={14} />
              </TouchableOpacity>
            </View>

            {/* SECCIÓN: TRANSACCIONES */}
            <View style={styles.tuSection}>
              <Text style={styles.tuSectionTitle}>TRANSACCIONES</Text>
              <TouchableOpacity style={styles.tuMenuItem} activeOpacity={0.7}>
                <View style={styles.tuMenuItemLeft}>
                  <ComprasIcon width={22} height={22} />
                  <Text style={styles.tuMenuItemText}>Compras</Text>
                </View>
                <SiguienteIcon width={14} height={14} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.tuMenuItem} activeOpacity={0.7}>
                <View style={styles.tuMenuItemLeft}>
                  <VentasIcon width={22} height={22} />
                  <Text style={styles.tuMenuItemText}>Ventas</Text>
                </View>
                <SiguienteIcon width={14} height={14} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.tuMenuItem} activeOpacity={0.7}>
                <View style={styles.tuMenuItemLeft}>
                  <BilleteraIcon width={22} height={22} />
                  <Text style={styles.tuMenuItemText}>Billetera</Text>
                </View>
                <SiguienteIcon width={14} height={14} />
              </TouchableOpacity>
            </View>

            {/* SECCIÓN: CUENTA */}
            <View style={styles.tuSection}>
              <Text style={styles.tuSectionTitle}>CUENTA</Text>
              <TouchableOpacity
                style={styles.tuMenuItem}
                activeOpacity={0.7}
                onPress={() => router.push('/profile' as any)}
              >
                <View style={styles.tuMenuItemLeft}>
                  <ConfiguracionIcon width={22} height={22} />
                  <Text style={styles.tuMenuItemText}>Ajustes</Text>
                </View>
                <SiguienteIcon width={14} height={14} />
              </TouchableOpacity>
            </View>

            {/* SECCIÓN: OTROS */}
            <View style={styles.tuSection}>
              <Text style={styles.tuSectionTitle}>OTROS</Text>
              <TouchableOpacity style={styles.tuMenuItem} activeOpacity={0.7}>
                <View style={styles.tuMenuItemLeft}>
                  <PreguntaIcon width={22} height={22} />
                  <Text style={styles.tuMenuItemText}>¿Necesitas ayuda?</Text>
                </View>
                <SiguienteIcon width={14} height={14} />
              </TouchableOpacity>
            </View>

            {/* Cerrar Sesión */}
            <View style={styles.logoutContainer}>
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
                activeOpacity={0.8}
              >
                <Ionicons name="log-out-outline" size={18} color="#EF4444" style={styles.logoutIcon} />
                <Text style={styles.logoutButtonText}>Cerrar sesión</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        ) : activeTab === 'inbox' ? (
          /* ========================================================= */
          /* BANDEJA DE ENTRADA / BUZÓN (Captura Referencia)          */
          /* ========================================================= */
          <InboxView
            onOpenConversation={(conv) => {
              router.push({
                pathname: '/chat',
                params: {
                  productTitle: conv.productTitle,
                  productPrice: conv.productPrice,
                  sellerName: conv.sellerName,
                },
              } as any);
            }}
          />
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  loadProducts();
                }}
                colors={['#1DE9B6']}
                tintColor="#1DE9B6"
              />
            }
          >
            {/* Banner Publicitario Superior */}
            <View style={styles.bannerContainer}>
              <View style={styles.bannerPlaceholder}>
                <View style={styles.bannerBadge}>
                  <Text style={styles.bannerBadgeText}>DESTACADO</Text>
                </View>
                <Text style={styles.bannerTitle}>Comprá y vendé cerca tuyo</Text>
                <Text style={styles.bannerSubtitle}>Miles de productos en Pilar y alrededores</Text>
              </View>
            </View>

            {/* Sección de Categorías con Iconos SVG */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Categorias</Text>
              <TouchableOpacity activeOpacity={0.7} onPress={() => setCategoriesModalVisible(true)}>
                <Text style={styles.moreCategoriesText}>Más categorias</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesScroll}
            >
              {CATEGORIES.map((cat) => {
                const Icon = cat.IconComponent;
                return (
                  <TouchableOpacity key={cat.id} style={styles.categoryItem} activeOpacity={0.75}>
                    <View style={styles.categoryCircle}>
                      <Icon width={28} height={28} />
                    </View>
                    <Text style={styles.categoryName} numberOfLines={2}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Estado de carga discreto */}
            {loadingProducts && products.length === 0 ? (
              <View style={{ paddingVertical: 32, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size="small" color="#1DE9B6" />
                <Text style={{ marginTop: 8, fontSize: 13, color: '#9098B1' }}>Cargando publicaciones...</Text>
              </View>
            ) : filteredProducts.length === 0 ? (
              <View style={{ paddingVertical: 40, alignItems: 'center', paddingHorizontal: 24 }}>
                <Ionicons name="bag-handle-outline" size={38} color="#9098B1" />
                <Text style={{ marginTop: 12, fontSize: 15, fontWeight: '600', color: '#1F232E', textAlign: 'center' }}>
                  No se encontraron productos
                </Text>
                <Text style={{ marginTop: 4, fontSize: 13, color: '#9098B1', textAlign: 'center' }}>
                  {searchQuery.trim() ? 'Prueba con otro término de búsqueda.' : 'Sé el primero en publicar un producto.'}
                </Text>
                <TouchableOpacity
                  onPress={loadProducts}
                  style={{ marginTop: 16, backgroundColor: '#E6FDF8', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20 }}
                >
                  <Text style={{ color: '#0D9488', fontSize: 13, fontWeight: '600' }}>Actualizar</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {/* Sección: Cerca de donde estás - Pilar */}
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleWithLocation}>
                    <Text style={styles.sectionTitle}>Cerca de donde estás</Text>
                    <View style={styles.locationBadge}>
                      <Ionicons name="location-sharp" size={12} color="#1DE9B6" />
                      <Text style={styles.locationBadgeText}>Pilar</Text>
                    </View>
                  </View>
                  <TouchableOpacity>
                    <Text style={styles.seeAllText}>Ver más</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalProductsScroll}
                >
                  {nearbyProducts.map((prod) => {
                    const isFav = favorites.includes(prod.id);
                    const coverUrl = getProductCoverImage(prod);
                    const formattedPrice = formatProductPrice(prod.price, prod.currency);

                    return (
                      <TouchableOpacity
                        key={prod.id}
                        style={styles.horizontalCard}
                        activeOpacity={0.85}
                        onPress={() => handleProductPress(prod.id)}
                      >
                        <View style={styles.imageContainer}>
                          <Image source={{ uri: coverUrl }} style={styles.productImage} />
                          <TouchableOpacity
                            style={styles.favoriteButton}
                            onPress={() => toggleFavorite(prod.id)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Ionicons
                              name={isFav ? 'heart' : 'heart-outline'}
                              size={18}
                              color={isFav ? '#EF4444' : '#1F232E'}
                            />
                          </TouchableOpacity>
                        </View>
                        <View style={styles.cardInfo}>
                          <Text style={styles.productPrice}>{formattedPrice}</Text>
                          <Text style={styles.productTitle} numberOfLines={2}>
                            {prod.title}
                          </Text>
                          <View style={styles.productFooter}>
                            <Ionicons name="location-outline" size={12} color="#9098B1" />
                            <Text style={styles.productLocation} numberOfLines={1}>
                              {prod.location || 'Pilar'}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Sección: Lo recién publicado */}
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Lo recién publicado</Text>
                  <TouchableOpacity>
                    <Text style={styles.seeAllText}>Ver todo</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.gridContainer}>
                  {recentProducts.map((prod) => {
                    const isFav = favorites.includes(prod.id);
                    const coverUrl = getProductCoverImage(prod);
                    const formattedPrice = formatProductPrice(prod.price, prod.currency);

                    return (
                      <TouchableOpacity
                        key={prod.id}
                        style={styles.gridCard}
                        activeOpacity={0.85}
                        onPress={() => handleProductPress(prod.id)}
                      >
                        <View style={styles.gridImageContainer}>
                          <Image source={{ uri: coverUrl }} style={styles.productImage} />
                          <TouchableOpacity
                            style={styles.favoriteButton}
                            onPress={() => toggleFavorite(prod.id)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Ionicons
                              name={isFav ? 'heart' : 'heart-outline'}
                              size={18}
                              color={isFav ? '#EF4444' : '#1F232E'}
                            />
                          </TouchableOpacity>
                        </View>
                        <View style={styles.gridCardInfo}>
                          <Text style={styles.productPrice}>{formattedPrice}</Text>
                          <Text style={styles.productTitle} numberOfLines={2}>
                            {prod.title}
                          </Text>
                          <View style={styles.productFooter}>
                            <Ionicons name="location-outline" size={12} color="#9098B1" />
                            <Text style={styles.productLocation} numberOfLines={1}>
                              {prod.location || 'Pilar'}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}
          </ScrollView>
        )}

        {/* ========================================================= */}
        {/* 3. BARRA DE NAVEGACIÓN INFERIOR (Exacto al diseño) */}
        {/* ========================================================= */}
        <View style={styles.bottomNavContainer}>
          <View style={styles.bottomNav}>
            {/* 1. Inicio */}
            <TouchableOpacity
              style={styles.navItem}
              onPress={() => setActiveTab('home')}
              activeOpacity={0.7}
            >
              <HomeIcon
                width={24}
                height={24}
                stroke={activeTab === 'home' ? PRIMARY_COLOR : '#9098B1'}
              />
              <Text style={[styles.navLabel, activeTab === 'home' && styles.navLabelActive]}>
                Inicio
              </Text>
            </TouchableOpacity>

            {/* 2. Favoritos */}
            <TouchableOpacity
              style={styles.navItem}
              onPress={() => setActiveTab('favorites')}
              activeOpacity={0.7}
            >
              <CorazonIcon
                width={24}
                height={24}
                fill={activeTab === 'favorites' ? PRIMARY_COLOR : '#9098B1'}
              />
              <Text style={[styles.navLabel, activeTab === 'favorites' && styles.navLabelActive]}>
                Favoritos
              </Text>
            </TouchableOpacity>

            {/* 3. Subir */}
            <TouchableOpacity
              style={styles.navItem}
              onPress={() => setActiveTab('upload')}
              activeOpacity={0.7}
            >
              <MasIcon
                width={24}
                height={24}
                stroke={activeTab === 'upload' ? PRIMARY_COLOR : '#9098B1'}
              />
              <Text style={[styles.navLabel, activeTab === 'upload' && styles.navLabelActive]}>
                Subir
              </Text>
            </TouchableOpacity>

            {/* 4. Buzón */}
            <TouchableOpacity
              style={styles.navItem}
              onPress={() => setActiveTab('inbox')}
              activeOpacity={0.7}
            >
              <MailIcon
                width={24}
                height={24}
                stroke={activeTab === 'inbox' ? PRIMARY_COLOR : '#9098B1'}
              />
              <Text style={[styles.navLabel, activeTab === 'inbox' && styles.navLabelActive]}>
                Buzón
              </Text>
            </TouchableOpacity>

            {/* 5. Perfil */}
            <TouchableOpacity
              style={styles.navItem}
              onPress={() => setActiveTab('profile')}
              activeOpacity={0.7}
            >
              <AvatarIcon
                width={24}
                height={24}
                fill={activeTab === 'profile' ? PRIMARY_COLOR : '#9098B1'}
              />
              <Text style={[styles.navLabel, activeTab === 'profile' && styles.navLabelActive]}>
                Perfil
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Modal Desplegable de Categorías */}
        <CategoriesMenuModal
          visible={categoriesModalVisible}
          onClose={() => setCategoriesModalVisible(false)}
          userAvatar={userAvatar}
          userName={userName}
          onAvatarPress={() => {
            setActiveTab('profile');
          }}
          onSelectCategory={(category) => {
            setCategoriesModalVisible(false);
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const PRIMARY_COLOR = '#1DE9B6';
const TEXT_DARK = '#1F232E';
const BG_CARD = '#FFFFFF';
const BORDER_COLOR = '#EBF0F5';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  // 1. Header Navbar Superior Exacto a la referencia
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

  // 2. Contenido Scrollable
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 95,
  },

  // ==========================================
  // ESTILOS PANTALLA "TU PERFIL" (Figma exacto)
  // ==========================================
  editProfileScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 110,
  },
  editProfileHeading: {
    fontSize: 22,
    fontWeight: '800',
    color: TEXT_DARK,
    marginBottom: 4,
  },
  editProfileSubheading: {
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
  editSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: TEXT_DARK,
    marginBottom: 12,
  },
  inputFieldLabel: {
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
  editTextInput: {
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
    transform: [{ translateX: -16 }, { translateY: -30 }],
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapExplanationText: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
    marginTop: 10,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  saveMessageBadge: {
    backgroundColor: '#E6FAF5',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginTop: 14,
    alignSelf: 'center',
  },
  saveMessageText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0D9488',
  },
  saveProfileButton: {
    backgroundColor: '#3BD7C2',
    borderRadius: 25,
    height: 48,
    width: '55%',
    maxWidth: 220,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 20,
    shadowColor: '#3BD7C2',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveProfileButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1F232E',
  },

  // Pestaña Cuenta
  accountTabContainer: {
    paddingTop: 10,
  },
  accountInfoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  accountInfoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9098B1',
    marginBottom: 4,
  },
  accountInfoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_DARK,
  },
  accountLogoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 14,
    gap: 6,
  },
  accountLogoutButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
  },

  // Perfil Público Navegación
  backToEditButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
  },
  backToEditText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0D9488',
  },

  // ==========================================
  // ESTILOS MENÚ DESPLEGABLE "TÚ" (Figma Referencia 1)
  // ==========================================
  tuMenuScrollContent: {
    paddingHorizontal: 0,
    paddingBottom: 110,
    backgroundColor: '#FFFFFF',
  },
  tuHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 22,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  tuAvatarWrapper: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: '#D9D9D9',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tuAvatarImage: {
    width: 82,
    height: 82,
    borderRadius: 41,
  },
  tuAvatarDefault: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: '#D9D9D9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tuAvatarDefaultText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#475569',
  },
  tuUserInfoCol: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  tuUserName: {
    fontSize: 20,
    fontWeight: '800',
    color: TEXT_DARK,
    marginBottom: 4,
  },
  tuRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 4,
  },
  tuRatingCount: {
    fontSize: 13.5,
    fontWeight: '700',
    color: TEXT_DARK,
    marginLeft: 3,
  },
  tuMemberSince: {
    fontSize: 13,
    color: '#64748B',
  },
  tuHeaderArrow: {
    padding: 6,
  },
  tuSection: {
    marginTop: 18,
  },
  tuSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: TEXT_DARK,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  tuMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
  },
  tuMenuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  tuMenuItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: TEXT_DARK,
  },

  // Logout
  logoutContainer: {
    marginTop: 26,
    paddingHorizontal: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
    gap: 8,
  },
  logoutIcon: {
    marginRight: 2,
  },
  logoutButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
  },

  // Banner
  bannerContainer: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },
  bannerPlaceholder: {
    backgroundColor: '#E2E8F0',
    borderRadius: 14,
    padding: 20,
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  bannerBadge: {
    backgroundColor: PRIMARY_COLOR,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  bannerBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1F232E',
  },
  bannerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: TEXT_DARK,
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 13,
    color: '#64748B',
  },

  // Secciones Generales
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 18,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: TEXT_DARK,
  },
  sectionTitleWithLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6FAF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 2,
  },
  locationBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0D9488',
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0D9488',
  },

  // Categorías con Iconos SVG
  categoriesScroll: {
    paddingHorizontal: 16,
    gap: 14,
  },
  categoryItem: {
    alignItems: 'center',
    width: 68,
  },
  categoryCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    marginBottom: 6,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '400',
    color: '#9098B1',
    textAlign: 'center',
    lineHeight: 15,
  },
  moreCategoriesText: {
    fontSize: 14,
    fontWeight: '700',
    color: PRIMARY_COLOR,
  },

  // Productos Horizontales
  horizontalProductsScroll: {
    paddingHorizontal: 16,
    gap: 14,
  },
  horizontalCard: {
    width: 170,
    backgroundColor: BG_CARD,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  imageContainer: {
    width: '100%',
    height: 130,
    position: 'relative',
    backgroundColor: '#F1F5F9',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardInfo: {
    padding: 10,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0D9488',
    marginBottom: 4,
  },
  productTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_DARK,
    lineHeight: 17,
    marginBottom: 8,
    minHeight: 34,
  },
  productFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  productLocation: {
    fontSize: 11,
    color: '#9098B1',
    flex: 1,
  },

  // Productos en Grilla (2 Columnas)
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    justifyContent: 'space-between',
  },
  gridCard: {
    width: '48%',
    backgroundColor: BG_CARD,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  gridImageContainer: {
    width: '100%',
    height: 140,
    position: 'relative',
    backgroundColor: '#F1F5F9',
  },
  gridCardInfo: {
    padding: 10,
  },

  // 3. Barra de Navegación Inferior (Footer Navbar Exacto al Diseño)
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
