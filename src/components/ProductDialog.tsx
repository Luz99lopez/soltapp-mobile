import React from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Props {
  visible: boolean;
  title: string;
  message: string;
  busy?: boolean;
  error?: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ProductDialog({ visible, title, message, busy, error, onCancel, onConfirm }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => { if (!busy) onCancel(); }}>
      <View style={styles.overlay}>
        <View style={styles.card} accessibilityViewIsModal>
          <Text accessibilityRole="header" style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
          <View style={styles.actions}>
            <TouchableOpacity accessibilityRole="button" disabled={busy} onPress={onCancel} style={styles.button}>
              <Text>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity accessibilityRole="button" disabled={busy} onPress={onConfirm} style={[styles.button, styles.danger]}>
              {busy ? <ActivityIndicator color="#FFF" /> : <Text style={styles.white}>Eliminar</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 420, padding: 24, backgroundColor: '#FFF', borderRadius: 20, gap: 16 },
  title: { fontSize: 20, fontWeight: '700', color: '#1F232E' },
  message: { fontSize: 15, lineHeight: 22, color: '#475569' },
  error: { color: '#B91C1C' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  button: { padding: 14, borderRadius: 24, alignItems: 'center', minWidth: 100, backgroundColor: '#F1F5F9' },
  danger: { backgroundColor: '#B91C1C' },
  white: { color: '#FFF', fontWeight: '700' },
});
