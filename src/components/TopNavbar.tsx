import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../supabase';
import CategoriesMenuModal from './CategoriesMenuModal';

// Componentes SVG oficiales de Soltapp
import IsotipoConFondo from '../../assets/svgs/isotipo con fondo.svg';
import BuscarIcon from '../../assets/svgs/Buscar.svg';
import VerTodoIcon from '../../assets/svgs/Ver todo.svg';

export interface TopNavbarProps {
  searchQuery?: string;
  onSearchQueryChange?: (text: string) => void;
  onSubmitSearch?: () => void;
  onOpenCategories?: () => void;
  userAvatar?: string | null;
  userName?: string;
  onAvatarPress?: () => void;
  activeScreen?: 'home' | 'profile' | 'public-profile' | 'other';
}

const PRIMARY_COLOR = '#3BD7C2';
const TEXT_DARK = '#1F232E';

export default function TopNavbar({
  searchQuery: externalQuery,
  onSearchQueryChange,
  onSubmitSearch,
  onOpenCategories,
  userAvatar: propAvatar,
  userName: propName,
  onAvatarPress,
  activeScreen = 'other',
}: TopNavbarProps) {
  const router = useRouter();
  const [internalQuery, setInternalQuery] = useState('');
  const [categoriesModalVisible, setCategoriesModalVisible] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const query = externalQuery !== undefined ? externalQuery : internalQuery;

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUser(user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const avatarUrl =
    propAvatar !== undefined
      ? propAvatar
      : currentUser?.user_metadata?.avatar_url || currentUser?.user_metadata?.picture || null;

  const displayName =
    propName !== undefined
      ? propName
      : currentUser?.user_metadata?.full_name ||
        currentUser?.user_metadata?.name ||
        currentUser?.user_metadata?.first_name ||
        'Usuario';

  const handleQueryChange = (text: string) => {
    if (onSearchQueryChange) {
      onSearchQueryChange(text);
    } else {
      setInternalQuery(text);
    }
  };

  const handleSearchSubmit = () => {
    if (onSubmitSearch) {
      onSubmitSearch();
    } else if (query.trim()) {
      router.push({ pathname: '/home', params: { q: query.trim() } } as any);
    }
  };

  const handleOpenCategories = () => {
    if (onOpenCategories) {
      onOpenCategories();
    } else {
      setCategoriesModalVisible(true);
    }
  };

  const handleAvatarClick = () => {
    if (onAvatarPress) {
      onAvatarPress();
    } else {
      router.push('/profile' as any);
    }
  };

  const isProfileActive = activeScreen === 'profile' || activeScreen === 'public-profile';

  return (
    <>
      <View style={styles.header}>
        {/* Isotipo con fondo turquesa oficial */}
        <TouchableOpacity
          style={styles.logoWrapper}
          activeOpacity={0.8}
          onPress={() => router.push('/home' as any)}
        >
          <IsotipoConFondo width={38} height={38} />
        </TouchableOpacity>

        {/* Barra de búsqueda píldora oficial */}
        <View style={styles.searchBar}>
          <BuscarIcon width={18} height={18} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar en todas las categorías"
            placeholderTextColor="#1F232E"
            value={query}
            onChangeText={handleQueryChange}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={() => handleQueryChange('')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather name="x" size={15} color="#9098B1" />
            </TouchableOpacity>
          )}
        </View>

        {/* Acciones a la derecha: Grilla Ver todo 2x2 + Avatar circular */}
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.gridIconButton}
            onPress={handleOpenCategories}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <VerTodoIcon width={24} height={24} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.avatarCircle,
              isProfileActive && styles.avatarCircleActive,
            ]}
            onPress={handleAvatarClick}
            activeOpacity={0.7}
          >
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.headerAvatarImg} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>
                  {displayName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Modal Desplegable de Categorías (Fallback interno si la pantalla no pasa onOpenCategories) */}
      {!onOpenCategories && (
        <CategoriesMenuModal
          visible={categoriesModalVisible}
          onClose={() => setCategoriesModalVisible(false)}
          userAvatar={avatarUrl}
          userName={displayName}
          onAvatarPress={() => {
            setCategoriesModalVisible(false);
            router.push('/profile' as any);
          }}
          onSelectCategory={(category) => {
            setCategoriesModalVisible(false);
            router.push({ pathname: '/home', params: { categoryId: category.id.toString() } } as any);
          }}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
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
});
