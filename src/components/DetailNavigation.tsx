import React, { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../supabase';
import CategoriesMenuModal from './CategoriesMenuModal';
import Logo from '../../assets/svgs/isotipo con fondo.svg';
import Buscar from '../../assets/svgs/Buscar.svg';
import VerTodo from '../../assets/svgs/Ver todo.svg';
import Home from '../../assets/svgs/Home.svg';
import Corazon from '../../assets/svgs/Corazón.svg';
import Mas from '../../assets/svgs/Más.svg';
import Mail from '../../assets/svgs/mail.svg';
import Avatar from '../../assets/svgs/Avatar.svg';

export type HomeTab = 'home' | 'favorites' | 'upload' | 'inbox' | 'profile';

export function DetailHeader() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [categoriesVisible, setCategoriesVisible] = useState(false);
  const [user, setUser] = useState<{ name: string; avatar?: string }>({ name: 'Usuario' });
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const metadata = session?.user.user_metadata;
      setUser({ name: metadata?.full_name || metadata?.name || 'Usuario', avatar: metadata?.avatar_url || metadata?.picture });
    });
    return () => subscription.unsubscribe();
  }, []);
  const goToProfile = () => router.dismissTo({ pathname: '/home', params: { tab: 'profile' } });

  return (
    <>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Inicio" onPress={() => router.dismissTo({ pathname: '/home', params: { tab: 'home' } })}>
          <Logo width={38} height={38} />
        </Pressable>
        <View style={styles.searchBar}>
          <Buscar width={18} height={18} />
          <TextInput
            accessibilityLabel="Buscar productos"
            placeholder="Buscar en todas las categorías"
            placeholderTextColor="#1F232E"
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            style={styles.searchInput}
          />
          {!!query && <Pressable accessibilityLabel="Borrar búsqueda" onPress={() => setQuery('')}><Ionicons name="close" size={15} color="#9098B1" /></Pressable>}
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Ver categorías" onPress={() => setCategoriesVisible(true)} hitSlop={8}>
          <VerTodo width={24} height={24} />
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Mi perfil" onPress={goToProfile} style={styles.avatar}>
          {user.avatar ? <Image source={{ uri: user.avatar }} style={styles.avatarImage} /> : <Text style={styles.initial}>{user.name.charAt(0).toUpperCase()}</Text>}
        </Pressable>
      </View>
      <CategoriesMenuModal visible={categoriesVisible} onClose={() => setCategoriesVisible(false)} userAvatar={user.avatar} userName={user.name} onAvatarPress={goToProfile} />
    </>
  );
}

const tabs = [
  { id: 'home', label: 'Inicio', Icon: Home },
  { id: 'favorites', label: 'Favoritos', Icon: Corazon },
  { id: 'upload', label: 'Subir', Icon: Mas },
  { id: 'inbox', label: 'Buzón', Icon: Mail },
  { id: 'profile', label: 'Perfil', Icon: Avatar },
] as const;

export function DetailBottomNav() {
  const router = useRouter();
  return (
    <View style={styles.bottomNav}>
      {tabs.map(({ id, label, Icon }) => (
        <Pressable key={id} accessibilityRole="button" accessibilityLabel={label} style={styles.navItem} onPress={() => router.dismissTo({ pathname: '/home', params: { tab: id } })}>
          <Icon width={24} height={24} {...(id === 'favorites' || id === 'profile' ? { fill: '#9098B1' } : { stroke: '#9098B1' })} />
          <Text style={styles.navLabel}>{label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', padding: 10, gap: 7, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  searchBar: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderColor: '#D8DEE6', borderRadius: 24, paddingHorizontal: 10, height: 44 },
  searchInput: { flex: 1, minWidth: 0, fontSize: 13, color: '#1F232E', padding: 0 },
  avatar: { width: 36, height: 36, borderRadius: 18, overflow: 'hidden', backgroundColor: '#D9D9D9', borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: '100%', height: '100%' },
  initial: { fontSize: 14, fontWeight: '700', color: '#475569' },
  bottomNav: { height: 60, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F1F5F9', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 6 },
  navLabel: { fontSize: 12, fontWeight: '500', color: '#9098B1', marginTop: 4 },
});
