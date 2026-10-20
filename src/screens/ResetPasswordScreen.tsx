import React, { useState, useEffect } from 'react';
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
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../supabase';

// Logotipo SVG oficial de Soltapp
import LogoSoltapp from '../../assets/svgs/logotipo color.svg';

const PRIMARY_COLOR = '#3BD7C2';
const TEXT_DARK = '#1F232E';

export default function ResetPasswordScreen() {
  const router = useRouter();

  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [checkingSession, setCheckingSession] = useState<boolean>(true);
  const [hasValidSession, setHasValidSession] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  // Verificación y extracción de tokens de recuperación de la URL
  useEffect(() => {
    let isMounted = true;

    const initRecoverySession = async () => {
      try {
        // 1. Soporte para Web: procesar parámetros de código PKCE o tokens en el hash (#access_token=...)
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          const searchParams = new URLSearchParams(window.location.search);
          const code = searchParams.get('code');

          if (code) {
            const { data, error: codeErr } = await supabase.auth.exchangeCodeForSession(code);
            if (!codeErr && data.session && isMounted) {
              setHasValidSession(true);
              setCheckingSession(false);
              return;
            }
          }

          if (window.location.hash) {
            const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
            const accessToken = hashParams.get('access_token');
            const refreshToken = hashParams.get('refresh_token');

            if (accessToken && refreshToken) {
              const { data, error: sessionErr } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });
              if (!sessionErr && data.session && isMounted) {
                setHasValidSession(true);
                setCheckingSession(false);
                return;
              }
            }
          }
        }

        // 2. Verificar si ya existe una sesión activa o en proceso de recuperación
        const { data: { session } } = await supabase.auth.getSession();
        if (session && isMounted) {
          setHasValidSession(true);
        } else {
          // Dar un breve margen a Supabase para detectar el session de la URL
          const { data: { user } } = await supabase.auth.getUser();
          if (user && isMounted) {
            setHasValidSession(true);
          }
        }
      } catch (err) {
        console.warn('[ResetPasswordScreen] Error verificando sesión de recuperación:', err);
      } finally {
        if (isMounted) {
          setCheckingSession(false);
        }
      }
    };

    initRecoverySession();

    // 3. Suscripción a cambios de estado de autenticación (evento PASSWORD_RECOVERY o SIGNED_IN)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN' || event === 'USER_UPDATED') && session) {
        if (isMounted) {
          setHasValidSession(true);
          setCheckingSession(false);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Lógica para actualizar la contraseña
  const handleUpdatePassword = async () => {
    setErrorMessage(null);

    if (!password || !confirmPassword) {
      setErrorMessage('Por favor completa ambos campos de contraseña.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden. Verifícalas e inténtalo de nuevo.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        throw error;
      }

      setIsSuccess(true);
    } catch (err: any) {
      console.error('[ResetPasswordScreen.handleUpdatePassword] Error:', err);
      setErrorMessage(
        err.message || 'No se pudo actualizar la contraseña. El enlace podría haber expirado.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoToLogin = async () => {
    try {
      await supabase.auth.signOut();
    } catch (_) {}
    router.replace('/login' as any);
  };

  const handleRequestNewLink = () => {
    router.replace('/forgot-password' as any);
  };

  // 1. Pantalla de carga mientras se verifica el token
  if (checkingSession) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={PRIMARY_COLOR} />
          <Text style={styles.loadingText}>Verificando enlace de seguridad...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Botón superior de retroceso / salida */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleGoToLogin}
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
            {/* Logotipo oficial de Soltapp */}
            <View style={styles.logoContainer}>
              <LogoSoltapp width={115} height={105} />
            </View>

            {/* Título principal */}
            <Text style={styles.headingTitle}>Crea una nueva contraseña</Text>

            {/* Subtítulo informativo */}
            <Text style={styles.subTitle}>
              Introduce tu nueva contraseña para volver a acceder a tu cuenta de Soltapp.
            </Text>

            {/* Caso de Éxito: Contraseña cambiada correctamente */}
            {isSuccess ? (
              <View style={styles.successCard}>
                <View style={styles.successIconCircle}>
                  <Feather name="check" size={26} color="#0D9488" />
                </View>
                <Text style={styles.successTitle}>¡Contraseña restablecida!</Text>
                <Text style={styles.successDescription}>
                  Tu contraseña se actualizó correctamente. Ahora puedes iniciar sesión con tus nuevas credenciales.
                </Text>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleGoToLogin}
                  activeOpacity={0.85}
                >
                  <Text style={styles.primaryButtonText}>Iniciar sesión</Text>
                </TouchableOpacity>
              </View>
            ) : !hasValidSession ? (
              /* Caso Enlace inválido o expirado */
              <View style={styles.invalidCard}>
                <View style={styles.invalidIconCircle}>
                  <Ionicons name="time-outline" size={28} color="#E11D48" />
                </View>
                <Text style={styles.invalidTitle}>Enlace expirado o no válido</Text>
                <Text style={styles.invalidDescription}>
                  El enlace de recuperación ha caducado o ya ha sido utilizado. Por favor solicita uno nuevo para continuar.
                </Text>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleRequestNewLink}
                  activeOpacity={0.85}
                >
                  <Text style={styles.primaryButtonText}>Solicitar nuevo enlace</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ marginTop: 16 }}
                  onPress={handleGoToLogin}
                  activeOpacity={0.7}
                >
                  <Text style={styles.secondaryLinkText}>Volver al inicio de sesión</Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* Formulario de Cambio de Contraseña */
              <View style={styles.formContainer}>
                {/* Input 1: Nueva Contraseña */}
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Nueva contraseña"
                    placeholderTextColor="#9098B1"
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={styles.eyeIconBtn}
                  >
                    <Feather
                      name={showPassword ? 'eye' : 'eye-off'}
                      size={20}
                      color="#9098B1"
                    />
                  </TouchableOpacity>
                </View>

                {/* Input 2: Confirmar Contraseña */}
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Confirmar nueva contraseña"
                    placeholderTextColor="#9098B1"
                    value={confirmPassword}
                    onChangeText={(text) => {
                      setConfirmPassword(text);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                    returnKeyType="done"
                    onSubmitEditing={handleUpdatePassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={styles.eyeIconBtn}
                  >
                    <Feather
                      name={showConfirmPassword ? 'eye' : 'eye-off'}
                      size={20}
                      color="#9098B1"
                    />
                  </TouchableOpacity>
                </View>

                {/* Indicaciones de seguridad */}
                <View style={styles.requirementsContainer}>
                  <View style={styles.requirementRow}>
                    <Feather
                      name={password.length >= 8 ? 'check-circle' : 'circle'}
                      size={14}
                      color={password.length >= 8 ? '#0D9488' : '#9098B1'}
                    />
                    <Text
                      style={[
                        styles.requirementText,
                        password.length >= 8 && styles.requirementTextValid,
                      ]}
                    >
                      Mínimo 8 caracteres
                    </Text>
                  </View>
                  <View style={styles.requirementRow}>
                    <Feather
                      name={
                        password.length > 0 && password === confirmPassword
                          ? 'check-circle'
                          : 'circle'
                      }
                      size={14}
                      color={
                        password.length > 0 && password === confirmPassword
                          ? '#0D9488'
                          : '#9098B1'
                      }
                    />
                    <Text
                      style={[
                        styles.requirementText,
                        password.length > 0 &&
                          password === confirmPassword &&
                          styles.requirementTextValid,
                      ]}
                    >
                      Las contraseñas coinciden
                    </Text>
                  </View>
                </View>

                {/* Mensaje de Error Integrado */}
                {errorMessage && (
                  <View style={styles.errorContainer}>
                    <Feather name="alert-circle" size={17} color="#E11D48" style={styles.errorIcon} />
                    <Text style={styles.errorText}>{errorMessage}</Text>
                  </View>
                )}

                {/* Botón Principal: Guardar contraseña */}
                <TouchableOpacity
                  style={[styles.primaryButton, loading && styles.buttonDisabled]}
                  onPress={handleUpdatePassword}
                  activeOpacity={0.85}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={TEXT_DARK} size="small" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Cambiar contraseña</Text>
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
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
    color: '#64748B',
    fontWeight: '500',
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
    marginBottom: 36,
  },
  headingTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: TEXT_DARK,
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: -0.2,
  },
  subTitle: {
    fontSize: 15.5,
    fontWeight: '400',
    color: TEXT_DARK,
    textAlign: 'center',
    lineHeight: 23,
    paddingHorizontal: 16,
    marginBottom: 36,
  },
  formContainer: {
    width: '100%',
    gap: 16,
  },
  inputWrapper: {
    width: '100%',
    height: 56,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#000000',
    borderRadius: 12,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_DARK,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}),
  },
  eyeIconBtn: {
    padding: 4,
    marginLeft: 8,
  },
  requirementsContainer: {
    gap: 6,
    paddingHorizontal: 4,
    marginTop: 4,
    marginBottom: 6,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  requirementText: {
    fontSize: 13,
    color: '#9098B1',
    fontWeight: '500',
  },
  requirementTextValid: {
    color: '#0D9488',
    fontWeight: '600',
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
    marginTop: 14,
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
  secondaryLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0D9488',
    textAlign: 'center',
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
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  successTitle: {
    fontSize: 19,
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
  invalidCard: {
    width: '100%',
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  invalidIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFE4E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  invalidTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#9F1239',
    textAlign: 'center',
  },
  invalidDescription: {
    fontSize: 14,
    color: '#BE123C',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
});
