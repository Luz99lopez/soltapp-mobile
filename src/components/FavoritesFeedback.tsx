import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFavorites } from '../contexts/FavoritesProvider';

export default function FavoritesFeedback() {
  const { actionError, clearActionError } = useFavorites();
  if (!actionError) return null;
  return (
    <View style={styles.banner} accessibilityLiveRegion="polite">
      <Text style={styles.message}>{actionError}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Cerrar aviso de favoritos" onPress={clearActionError} style={styles.dismiss}>
        <Text style={styles.message}>Cerrar</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { margin: 12, padding: 12, borderRadius: 10, backgroundColor: '#FFF1F2', flexDirection: 'row', alignItems: 'center', gap: 8 },
  message: { flexShrink: 1, color: '#9F1239', fontSize: 14 },
  dismiss: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 },
});
