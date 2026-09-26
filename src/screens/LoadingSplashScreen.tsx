import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  StatusBar,
  Animated,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';

import { supabase } from '../supabase';

// Isotipo blanco oficial de Soltapp
import IsotipoBlanco from '../../assets/svgs/Isotipo blanco 1.svg';

const BG_COLOR = '#3BD7C2'; // Color turquesa oficial de la pantalla de carga

export default function LoadingSplashScreen() {
  const router = useRouter();

  // Animaciones de entrada suave
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    let isMounted = true;

    // 1. Animación de entrada del logo
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 7,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Comprobar sesión de Supabase (OAuth o sesión persistida)
    const checkSessionAndNavigate = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        setTimeout(() => {
          if (!isMounted) return;

          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 350,
            useNativeDriver: true,
          }).start(() => {
            if (!isMounted) return;
            if (session) {
              router.replace('/home' as any);
            } else {
              router.replace('/login' as any);
            }
          });
        }, 1200);
      } catch {
        setTimeout(() => {
          if (!isMounted) return;
          router.replace('/login' as any);
        }, 1200);
      }
    };

    checkSessionAndNavigate();

    return () => {
      isMounted = false;
    };
  }, [fadeAnim, scaleAnim, router]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={BG_COLOR} />
      <View style={styles.centerWrapper}>
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <IsotipoBlanco width={150} height={97} />
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_COLOR,
  },
  centerWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
