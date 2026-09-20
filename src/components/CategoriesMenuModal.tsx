import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Platform,
  Image,
  TextInput,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

// Componentes SVG oficiales de Soltapp
import IsotipoConFondo from '../../assets/svgs/isotipo con fondo.svg';
import BuscarIcon from '../../assets/svgs/Buscar.svg';
import VerTodoIcon from '../../assets/svgs/Ver todo.svg';
import SiguienteIcon from '../../assets/svgs/Siguiente.svg';
import HomeIcon from '../../assets/svgs/Home.svg';
import CorazonIcon from '../../assets/svgs/Corazón.svg';
import MasIcon from '../../assets/svgs/Más.svg';
import MailIcon from '../../assets/svgs/mail.svg';
import AvatarIcon from '../../assets/svgs/Avatar.svg';

// Iconos SVG oficiales de Categorías
import AutoIcon from '../../assets/svgs/Auto.svg';
import MotoIcon from '../../assets/svgs/Moto.svg';
import MotorIcon from '../../assets/svgs/Motor y accesorios.svg';
import ModaIcon from '../../assets/svgs/Moda y accesorios.svg';
import InmobiliariaIcon from '../../assets/svgs/Inmobiliaria.svg';
import TecnologiaIcon from '../../assets/svgs/tecnologia y electronica.svg';
import MovilesIcon from '../../assets/svgs/Moviles y telefonia.svg';
import InformaticaIcon from '../../assets/svgs/Informatica.svg';
import DeporteIcon from '../../assets/svgs/Deporte y ocio.svg';
import BicicletasIcon from '../../assets/svgs/Bicicletas.svg';
import ConsolasIcon from '../../assets/svgs/Consolas y videojuegos.svg';
import HogarIcon from '../../assets/svgs/Hogar y jardin.svg';
import ElectrodomesticosIcon from '../../assets/svgs/Electrodomesticos.svg';
import CineMusicaIcon from '../../assets/svgs/Cinem libros y musica.svg';
import NinosBebesIcon from '../../assets/svgs/Niños y bebes.svg';
import ColeccionismoIcon from '../../assets/svgs/Coleccionismo.svg';
import ConstruccionIcon from '../../assets/svgs/Construccion.svg';
import IndustriaIcon from '../../assets/svgs/Industria y agricultura.svg';
import OtrosIcon from '../../assets/svgs/Otros.svg';

export interface CategoryItem {
  id: string;
  name: string;
  IconComponent: React.FC<any>;
  hasChevron?: boolean;
}

// 1. Categorías Principales (Todas con Chevron según diseño Figma)
export const MAIN_CATEGORIES: CategoryItem[] = [
  { id: 'm1', name: 'Autos', IconComponent: AutoIcon, hasChevron: true },
  { id: 'm2', name: 'Motos', IconComponent: MotoIcon, hasChevron: true },
  { id: 'm3', name: 'Motor y accesorios', IconComponent: MotorIcon, hasChevron: true },
  { id: 'm4', name: 'Moda y accesorios', IconComponent: ModaIcon, hasChevron: true },
  { id: 'm5', name: 'Inmobiliaria', IconComponent: InmobiliariaIcon, hasChevron: true },
];

// 2. Ver Todas las Categorías (Exacto a la lista de referencia)
export const ALL_CATEGORIES: CategoryItem[] = [
  { id: 'all0', name: 'Ver todo', IconComponent: VerTodoIcon, hasChevron: false },
  { id: 'all1', name: 'Autos', IconComponent: AutoIcon, hasChevron: false },
  { id: 'all2', name: 'Motos', IconComponent: MotoIcon, hasChevron: false },
  { id: 'all3', name: 'Motor y accesorios', IconComponent: MotorIcon, hasChevron: true },
  { id: 'all4', name: 'Moda y accesorios', IconComponent: ModaIcon, hasChevron: true },
  { id: 'all5', name: 'Inmobiliaria', IconComponent: InmobiliariaIcon, hasChevron: false },
  { id: 'all6', name: 'Tecnología y electrónica', IconComponent: TecnologiaIcon, hasChevron: true },
  { id: 'all7', name: 'Celulares y telefonía', IconComponent: MovilesIcon, hasChevron: true },
  { id: 'all8', name: 'Informática', IconComponent: InformaticaIcon, hasChevron: true },
  { id: 'all9', name: 'Deporte y ocio', IconComponent: DeporteIcon, hasChevron: true },
  { id: 'all10', name: 'Bicicletas', IconComponent: BicicletasIcon, hasChevron: true },
  { id: 'all11', name: 'Consolas y videojuegos', IconComponent: ConsolasIcon, hasChevron: true },
  { id: 'all12', name: 'Hogar y jardín', IconComponent: HogarIcon, hasChevron: true },
  { id: 'all13', name: 'Electrodomésticos', IconComponent: ElectrodomesticosIcon, hasChevron: true },
  { id: 'all14', name: 'Cine, libros y música', IconComponent: CineMusicaIcon, hasChevron: true },
  { id: 'all15', name: 'Niños y bebés', IconComponent: NinosBebesIcon, hasChevron: true },
  { id: 'all16', name: 'Coleccionismo', IconComponent: ColeccionismoIcon, hasChevron: true },
  { id: 'all17', name: 'Construcción y reformas', IconComponent: ConstruccionIcon, hasChevron: true },
  { id: 'all18', name: 'Industria y agricultura', IconComponent: IndustriaIcon, hasChevron: true },
  { id: 'all19', name: 'Otros', IconComponent: OtrosIcon, hasChevron: false },
];

interface CategoriesMenuModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectCategory?: (category: CategoryItem) => void;
  userAvatar?: string | null;
  userName?: string;
  onAvatarPress?: () => void;
}

export default function CategoriesMenuModal({
  visible,
  onClose,
  onSelectCategory,
  userAvatar,
  userName = 'Jose Luis',
  onAvatarPress,
}: CategoriesMenuModalProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleCategoryPress = (category: CategoryItem) => {
    if (onSelectCategory) {
      onSelectCategory(category);
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

        <View style={styles.container}>
          {/* ========================================================= */}
          {/* 1. HEADER NAVBAR SUPERIOR (Mismo que Home)                */}
          {/* ========================================================= */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.logoWrapper}
              activeOpacity={0.8}
              onPress={onClose}
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
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Feather name="x" size={15} color="#9098B1" />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.gridIconButton}
                onPress={onClose}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <VerTodoIcon width={24} height={24} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.avatarCircle}
                onPress={() => {
                  onClose();
                  if (onAvatarPress) onAvatarPress();
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
          {/* 2. LISTA DESPLEGABLE DE CATEGORÍAS                        */}
          {/* ========================================================= */}
          <ScrollView
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Botón de Cierre 'X' a la derecha */}
            <View style={styles.closeRow}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                activeOpacity={0.7}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Feather name="x" size={24} color="#1F232E" />
              </TouchableOpacity>
            </View>

            {/* SECCIÓN 1: Categorías principales */}
            <Text style={styles.sectionHeading}>Categorías principales</Text>

            <View style={styles.categoriesList}>
              {MAIN_CATEGORIES.map((cat) => {
                const Icon = cat.IconComponent;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={styles.categoryRow}
                    onPress={() => handleCategoryPress(cat)}
                    activeOpacity={0.65}
                  >
                    <View style={styles.leftIconContainer}>
                      <Icon width={22} height={22} />
                    </View>

                    <Text style={styles.categoryCenteredTitle}>{cat.name}</Text>

                    <View style={styles.rightChevronContainer}>
                      {cat.hasChevron ? (
                        <SiguienteIcon width={14} height={14} stroke="#1F232E" />
                      ) : (
                        <View style={{ width: 14 }} />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* SECCIÓN 2: Ver todas las categorías */}
            <Text style={[styles.sectionHeading, { marginTop: 24 }]}>
              Ver todas las categorías
            </Text>

            <View style={styles.categoriesList}>
              {ALL_CATEGORIES.map((cat) => {
                const Icon = cat.IconComponent;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={styles.categoryRow}
                    onPress={() => handleCategoryPress(cat)}
                    activeOpacity={0.65}
                  >
                    <View style={styles.leftIconContainer}>
                      <Icon width={22} height={22} />
                    </View>

                    <Text style={styles.categoryCenteredTitle}>{cat.name}</Text>

                    <View style={styles.rightChevronContainer}>
                      {cat.hasChevron ? (
                        <SiguienteIcon width={14} height={14} stroke="#1F232E" />
                      ) : (
                        <View style={{ width: 14 }} />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* ========================================================= */}
          {/* 3. BARRA DE NAVEGACIÓN INFERIOR (Footer Navbar)           */}
          {/* ========================================================= */}
          <View style={styles.bottomNavContainer}>
            <View style={styles.bottomNav}>
              <TouchableOpacity
                style={styles.navItem}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <HomeIcon width={24} height={24} stroke="#1DE9B6" />
                <Text style={[styles.navLabel, styles.navLabelActive]}>Inicio</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.navItem}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <CorazonIcon width={24} height={24} fill="#9098B1" />
                <Text style={styles.navLabel}>Favoritos</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.navItem}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <MasIcon width={24} height={24} stroke="#9098B1" />
                <Text style={styles.navLabel}>Subir</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.navItem}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <MailIcon width={24} height={24} stroke="#9098B1" />
                <Text style={styles.navLabel}>Buzón</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.navItem}
                onPress={() => {
                  onClose();
                  if (onAvatarPress) onAvatarPress();
                }}
                activeOpacity={0.7}
              >
                <AvatarIcon width={24} height={24} fill="#9098B1" />
                <Text style={styles.navLabel}>Perfil</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

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

  // 1. Header Navbar Superior
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
  scrollContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 110,
  },

  // Botón de Cierre
  closeRow: {
    alignItems: 'flex-end',
    marginBottom: 6,
  },
  closeButton: {
    padding: 4,
  },

  // Encabezados de Sección
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: TEXT_DARK,
    marginBottom: 10,
    marginTop: 6,
  },

  // Lista de Categorías
  categoriesList: {
    backgroundColor: '#FFFFFF',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  leftIconContainer: {
    width: 32,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  categoryCenteredTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '500',
    color: TEXT_DARK,
  },
  rightChevronContainer: {
    width: 32,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },

  // 3. Footer Navbar
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
