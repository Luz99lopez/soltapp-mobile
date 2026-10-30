import { useRouter } from 'expo-router';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Componentes SVG oficiales de Soltapp
import AvatarIcon from '../../assets/svgs/Avatar.svg';
import CorazonIcon from '../../assets/svgs/Corazón.svg';
import HomeIcon from '../../assets/svgs/Home.svg';
import MasIcon from '../../assets/svgs/Más.svg';
import MailIcon from '../../assets/svgs/mail.svg';

export type BottomNavTab = 'home' | 'favorites' | 'upload' | 'inbox' | 'profile';

export interface BottomNavbarProps {
  activeTab: BottomNavTab;
  onTabPress?: (tab: BottomNavTab) => void;
}

const ACTIVE_COLOR = '#0D9488';
const INACTIVE_COLOR = '#9098B1';

export default function BottomNavbar({ activeTab, onTabPress }: BottomNavbarProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handlePress = (tab: BottomNavTab) => {
    if (onTabPress) {
      onTabPress(tab);
      return;
    }

    switch (tab) {
      case 'home':
        router.push('/home' as any);
        break;
      case 'favorites':
        router.push({ pathname: '/home', params: { tab: 'favorites' } } as any);
        break;
      case 'upload':
        router.push('/upload' as any);
        break;
      case 'inbox':
        router.push('/chat' as any);
        break;
      case 'profile':
        router.push('/profile' as any);
        break;
    }
  };

  return (
    <View style={[styles.bottomNavContainer, { paddingBottom: Platform.OS === 'android' ? 48 : 20 }]}>
      <View style={styles.bottomNav}>
        {/* 1. Inicio */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => handlePress('home')}
          activeOpacity={0.7}
        >
          <HomeIcon
            width={24}
            height={24}
            stroke={activeTab === 'home' ? ACTIVE_COLOR : INACTIVE_COLOR}
          />
          <Text style={[styles.navLabel, activeTab === 'home' && styles.navLabelActive]}>
            Inicio
          </Text>
        </TouchableOpacity>

        {/* 2. Favoritos */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => handlePress('favorites')}
          activeOpacity={0.7}
        >
          <CorazonIcon
            width={24}
            height={24}
            fill={activeTab === 'favorites' ? ACTIVE_COLOR : INACTIVE_COLOR}
          />
          <Text style={[styles.navLabel, activeTab === 'favorites' && styles.navLabelActive]}>
            Favoritos
          </Text>
        </TouchableOpacity>

        {/* 3. Súbelo */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => handlePress('upload')}
          activeOpacity={0.7}
        >
          <MasIcon
            width={24}
            height={24}
            stroke={activeTab === 'upload' ? ACTIVE_COLOR : INACTIVE_COLOR}
          />
          <Text style={[styles.navLabel, activeTab === 'upload' && styles.navLabelActive]}>
            Súbelo
          </Text>
        </TouchableOpacity>

        {/* 4. Buzón */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => handlePress('inbox')}
          activeOpacity={0.7}
        >
          <MailIcon
            width={24}
            height={24}
            stroke={activeTab === 'inbox' ? ACTIVE_COLOR : INACTIVE_COLOR}
          />
          <Text style={[styles.navLabel, activeTab === 'inbox' && styles.navLabelActive]}>
            Buzón
          </Text>
        </TouchableOpacity>

        {/* 5. Tú (Perfil) */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => handlePress('profile')}
          activeOpacity={0.7}
        >
          <AvatarIcon
            width={24}
            height={24}
            fill={activeTab === 'profile' ? ACTIVE_COLOR : INACTIVE_COLOR}
          />
          <Text style={[styles.navLabel, activeTab === 'profile' && styles.navLabelActive]}>
            Tú
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNavContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    zIndex: 100,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  bottomNav: {
    height: 60,
    backgroundColor: '#FFFFFF',
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
    color: ACTIVE_COLOR,
    fontWeight: '700',
  },
});