import React from 'react';
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
} from 'react-native';

// Iconos de navegación del Modal
import XIcon from '../../assets/svgs/X.svg';
import SiguienteIcon from '../../assets/svgs/Siguiente.svg';

// Iconos SVG oficiales de Categorías
import VerTodoIcon from '../../assets/svgs/Ver todo.svg';
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
}

// 1. Categorías Principales
export const MAIN_CATEGORIES: CategoryItem[] = [
  { id: 'm1', name: 'Autos', IconComponent: AutoIcon },
  { id: 'm2', name: 'Motos', IconComponent: MotoIcon },
  { id: 'm3', name: 'Motor y accesorios', IconComponent: MotorIcon },
  { id: 'm4', name: 'Moda y accesorios', IconComponent: ModaIcon },
  { id: 'm5', name: 'Inmobiliaria', IconComponent: InmobiliariaIcon },
];

// 2. Todas las Categorías
export const ALL_CATEGORIES: CategoryItem[] = [
  { id: 'all0', name: 'Ver todo', IconComponent: VerTodoIcon },
  { id: 'all1', name: 'Autos', IconComponent: AutoIcon },
  { id: 'all2', name: 'Motos', IconComponent: MotoIcon },
  { id: 'all3', name: 'Motor y accesorios', IconComponent: MotorIcon },
  { id: 'all4', name: 'Moda y accesorios', IconComponent: ModaIcon },
  { id: 'all5', name: 'Inmobiliaria', IconComponent: InmobiliariaIcon },
  { id: 'all6', name: 'Tecnología y electrónica', IconComponent: TecnologiaIcon },
  { id: 'all7', name: 'Celulares y telefonía', IconComponent: MovilesIcon },
  { id: 'all8', name: 'Informática', IconComponent: InformaticaIcon },
  { id: 'all9', name: 'Deporte y ocio', IconComponent: DeporteIcon },
  { id: 'all10', name: 'Bicicletas', IconComponent: BicicletasIcon },
  { id: 'all11', name: 'Consolas y videojuegos', IconComponent: ConsolasIcon },
  { id: 'all12', name: 'Hogar y jardín', IconComponent: HogarIcon },
  { id: 'all13', name: 'Electrodomésticos', IconComponent: ElectrodomesticosIcon },
  { id: 'all14', name: 'Cine, libros y música', IconComponent: CineMusicaIcon },
  { id: 'all15', name: 'Niños y bebés', IconComponent: NinosBebesIcon },
  { id: 'all16', name: 'Coleccionismo', IconComponent: ColeccionismoIcon },
  { id: 'all17', name: 'Construcción y reformas', IconComponent: ConstruccionIcon },
  { id: 'all18', name: 'Industria y agricultura', IconComponent: IndustriaIcon },
  { id: 'all19', name: 'Otros', IconComponent: OtrosIcon },
];

interface CategoriesMenuModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectCategory?: (category: CategoryItem) => void;
}

export default function CategoriesMenuModal({
  visible,
  onClose,
  onSelectCategory,
}: CategoriesMenuModalProps) {
  const handleCategoryPress = (category: CategoryItem) => {
    if (onSelectCategory) {
      onSelectCategory(category);
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

        {/* Encabezado Superior con Título y Botón de Cierre (X) */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Categorías principales</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <XIcon width={20} height={20} fill="#1F232E" />
          </TouchableOpacity>
        </View>

        {/* Lista Desplazable de Categorías */}
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ========================================================= */}
          {/* SECCIÓN 1: CATEGORÍAS PRINCIPALES */}
          {/* ========================================================= */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>Categorías principales</Text>
          </View>

          <View style={styles.categoryListCard}>
            {MAIN_CATEGORIES.map((cat, index) => {
              const Icon = cat.IconComponent;
              const isLast = index === MAIN_CATEGORIES.length - 1;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.categoryRow, isLast && styles.categoryRowLast]}
                  onPress={() => handleCategoryPress(cat)}
                  activeOpacity={0.65}
                >
                  <View style={styles.iconWrapper}>
                    <Icon width={24} height={24} />
                  </View>
                  <Text style={styles.categoryTitle}>{cat.name}</Text>
                  <View style={styles.arrowWrapper}>
                    <SiguienteIcon width={16} height={16} stroke="#9098B1" />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ========================================================= */}
          {/* SECCIÓN 2: VER TODAS LAS CATEGORÍAS */}
          {/* ========================================================= */}
          <View style={[styles.sectionHeader, styles.secondSectionHeader]}>
            <Text style={styles.sectionHeaderText}>Ver todas las categorías</Text>
          </View>

          <View style={styles.categoryListCard}>
            {ALL_CATEGORIES.map((cat, index) => {
              const Icon = cat.IconComponent;
              const isLast = index === ALL_CATEGORIES.length - 1;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.categoryRow, isLast && styles.categoryRowLast]}
                  onPress={() => handleCategoryPress(cat)}
                  activeOpacity={0.65}
                >
                  <View style={styles.iconWrapper}>
                    <Icon width={24} height={24} />
                  </View>
                  <Text style={styles.categoryTitle}>{cat.name}</Text>
                  <View style={styles.arrowWrapper}>
                    <SiguienteIcon width={16} height={16} stroke="#9098B1" />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const PRIMARY_COLOR = '#1DE9B6';
const TEXT_DARK = '#1F232E';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_DARK,
  },
  closeButton: {
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  sectionHeader: {
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  secondSectionHeader: {
    marginTop: 24,
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_DARK,
  },
  categoryListCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EBF0F5',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  categoryRowLast: {
    borderBottomWidth: 0,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  categoryTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: TEXT_DARK,
  },
  arrowWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 8,
  },
});
