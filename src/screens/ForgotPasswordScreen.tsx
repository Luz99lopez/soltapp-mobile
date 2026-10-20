import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../supabase';
import { getAuthRedirectUri } from '../utils/auth';

// Logotipo SVG oficial de Soltapp
import LogoSoltapp from '../../assets/svgs/logotipo color.svg';

const PRIMARY_COLOR = '#3BD7C2';
const TEXT_DARK = '#1F232E';

export default function ForgotPasswordScreen() {
  const router = useRouter();

  const [email, setEmail] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successSent, setSuccessSent] = useState<boolean>(false);

  // Validación de formato de correo con expresión regular (RegEx)
  const isValidEmail = (emailStr: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailStr);
  };

  const handleSendCode = async () => {
    setErrorMessage(null);
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setErrorMessage('Por favor ingresa tu dirección de email.');
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setErrorMessage('Ingresa un correo electrónico válido.');
      return;
    }

    setLoading(true);
    try {
      const redirectUri = getAuthRedirectUri('reset-password');
      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: redirectUri,
      });

      if (error) {
        throw error;
      }

      setSuccessSent(true);
    } catch (err: any) {
      console.error('[ForgotPasswordScreen.handleSendCode] Error:', err);
      setErrorMessage(
        err.message || 'No se pudo enviar el correo de recuperación. Inténtalo nuevamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/login' as any);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Botón superior de retroceso */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackToLogin}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={24} color={TEXT_DARK} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.contentWrapper}>
            {/* 1. Logotipo oficial de Soltapp */}
            <View style={styles.logoContainer}>
              <LogoSoltapp width={115} height={105} />
            </View>

            {/* 2. Título principal */}
            <Text style={styles.headingTitle}>Restablece tu contraseña</Text>

            {/* 3. Subtítulo / Instrucción */}
            <Text style={styles.subTitle}>
              Introduce la dirección de email vinculada a tu cuenta de Soltapp.
            </Text>

            {/* Vista de éxito tras enviar el correo */}
            {successSent ? (
              <View style={styles.successCard}>
                <View style={styles.successIconCircle}>
                  <Feather name="check" size={24} color="#0D9488" />
                </View>
                <Text style={styles.successTitle}>¡Correo enviado con éxito!</Text>
                <Text style={styles.successDescription}>
                  Te hemos enviado las instrucciones y el enlace a{' '}
                  <Text style={{ fontWeight: '700', color: TEXT_DARK }}>{email.trim()}</Text>.
                  Por favor revisa tu bandeja de entrada o spam.
                </Text>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleBackToLogin}
                  activeOpacity={0.85}
                >
                  <Text style={styles.primaryButtonText}>Volver al inicio de sesión</Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* Formulario principal */
              <View style={styles.formContainer}>
                {/* Input Dirección de email */}
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Dirección de email"
                    placeholderTextColor="#9098B1"
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                    returnKeyType="send"
                    onSubmitEditing={handleSendCode}
                  />
                </View>

                {/* Mensaje de Error Integrado */}
                {errorMessage && (
                  <View style={styles.errorContainer}>
                    <Feather name="alert-circle" size={17} color="#E11D48" style={styles.errorIcon} />
                    <Text style={styles.errorText}>{errorMessage}</Text>
                  </View>
                )}

                {/* Botón "Enviar código" */}
                <TouchableOpacity
                  style={[styles.primaryButton, loading && styles.buttonDisabled]}
                  onPress={handleSendCode}
                  activeOpacity={0.85}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={TEXT_DARK} size="small" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Enviar código</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerBar: {
    height: 48,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backButton: {
    padding: 4,
    borderRadius: 8,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 36,
  },
  contentWrapper: {
    flex: 1,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 44,
  },
  headingTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: TEXT_DARK,
    textAlign: 'center',
    marginBottom: 36,
    letterSpacing: -0.2,
  },
  subTitle: {
    fontSize: 16,
    fontWeight: '400',
    color: TEXT_DARK,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
    marginBottom: 48,
  },
  formContainer: {
    width: '100%',
    gap: 20,
  },
  inputWrapper: {
    width: '100%',
    height: 56,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#000000',
    borderRadius: 12,
    paddingHorizontal: 18,
    justifyContent: 'center',
  },
  input: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_DARK,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}),
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  errorIcon: {
    marginRight: 2,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#E11D48',
    fontWeight: '500',
  },
  primaryButton: {
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 28,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    width: '100%',
    shadowColor: PRIMARY_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 2,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_DARK,
  },
  successCard: {
    width: '100%',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  successIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#166534',
    textAlign: 'center',
  },
  successDescription: {
    fontSize: 14,
    color: '#15803D',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
});
