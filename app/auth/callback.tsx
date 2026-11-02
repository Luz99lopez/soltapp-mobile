import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { completeWebAuthCallback } from '@/src/services/authCallbackService';

export default function AuthCallbackScreen() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const timeout = setTimeout(() => {
      if (active) { active = false; setError('La validación de la sesión tardó demasiado. Revisá tu conexión e intentá iniciar sesión nuevamente.'); }
    }, 15000);
    const url = Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.href : 'soltapp://auth/callback';
    completeWebAuthCallback(url).then(() => {
      if (active) router.replace('/home');
    }).catch(reason => {
      if (active) setError(reason instanceof Error ? reason.message : 'No se pudo completar el inicio de sesión.');
    }).finally(() => clearTimeout(timeout));
    return () => { active = false; clearTimeout(timeout); };
  }, [router]);

  return (
    <View style={styles.container}>
      {error ? <>
        <Text accessibilityRole="alert" style={styles.text}>{error}</Text>
        <TouchableOpacity accessibilityRole="button" onPress={() => router.replace('/login')} style={styles.button}><Text>Volver a iniciar sesión</Text></TouchableOpacity>
      </> : <><ActivityIndicator size="large" color="#1DE9B6" /><Text style={styles.text}>Validando tu sesión...</Text></>}
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
    padding: 24,
  },
  text: {
    fontSize: 15,
    color: '#1F232E',
    fontWeight: '500',
    textAlign: 'center',
  },
  button: { padding: 16, borderRadius: 24, backgroundColor: '#3BD7C2' },
});
