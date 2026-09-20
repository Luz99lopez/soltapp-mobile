import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/src/supabase';

export default function AuthCallbackScreen() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (session) {
          router.replace('/home' as any);
          return;
        }

        // Suscripción al cambio de estado de auth (por si aún se está procesando la URL)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
          if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && newSession) {
            subscription.unsubscribe();
            router.replace('/home' as any);
          }
        });

        // Timeout de seguridad en caso de fallo
        const timeout = setTimeout(() => {
          subscription.unsubscribe();
          router.replace('/home' as any);
        }, 2000);

        return () => {
          clearTimeout(timeout);
          subscription.unsubscribe();
        };
      } catch {
        router.replace('/home' as any);
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#1DE9B6" />
      <Text style={styles.text}>Iniciando sesión...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  text: {
    fontSize: 15,
    color: '#1F232E',
    fontWeight: '500',
  },
});
