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

export default function RegisterScreen() {
  const router = useRouter();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // Estados visuales integrados en la UI
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showLoginLink, setShowLoginLink] = useState<boolean>(false);

  // Validación de formato de correo con expresión regular (RegEx)
  const isValidEmail = (emailStr: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailStr);
  };

  // Limpiar mensajes reactivamente cuando el usuario escribe
  const clearMessages = () => {
    if (errorMessage) {
      setErrorMessage(null);
      setShowLoginLink(false);
    }
    if (successMessage) {
      setSuccessMessage(null);
    }
  };

  // Lógica de registro y validaciones con Supabase
  const handleRegister = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setShowLoginLink(false);

    const trimmedEmail = email.trim();

    // 1. Validar campos obligatorios
    if (!trimmedEmail || !password || !confirmPassword) {
      setErrorMessage('Por favor completa todos los campos.');
      return;
    }

    // 2. Validar formato de correo (Regex)
    if (!isValidEmail(trimmedEmail)) {
      setErrorMessage('El correo es inválido');
      return;
    }

    // 3. Validar longitud de la contraseña (mínimo 8 caracteres)
    if (password.length < 8) {
      setErrorMessage('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    // 4. Validar coincidencia de contraseñas
    if (password !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden.');
      return;
    }

    try {
      setLoading(true);

      const redirectUri = getAuthRedirectUri();

      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password: password,
        options: {
          emailRedirectTo: redirectUri,
        },
      });

      if (error) {
        const msg = (error.message || '').toLowerCase();
        if (
          msg.includes('user already registered') ||
          msg.includes('already registered') ||
          msg.includes('user_already_exists') ||
          msg.includes('identity already exists')
        ) {
          setErrorMessage('Este correo ya se encuentra registrado.');
          setShowLoginLink(true);
        } else if (msg.includes('invalid email') || msg.includes('email address is invalid')) {
          setErrorMessage('El correo es inválido');
        } else if (msg.includes('password should be at least') || msg.includes('weak_password')) {
          setErrorMessage('La contraseña debe tener al menos 8 caracteres.');
        } else if (msg.includes('rate limit') || msg.includes('too many requests')) {
          setErrorMessage('Demasiados intentos. Espera unos minutos.');
        } else if (msg.includes('invalid api key') || msg.includes('apikey')) {
          setErrorMessage('Clave de API de Supabase no configurada o inválida.');
        } else {
          setErrorMessage(error.message || 'Ocurrió un error al intentar crear la cuenta.');
        }
        return;
      }

      // En Supabase, si la confirmación de email está activa y el usuario ya existe, data.user.identities es un array vacío
      if (data?.user && data.user.identities && data.user.identities.length === 0) {
        setErrorMessage('Este correo ya se encuentra registrado.');
        setShowLoginLink(true);
        return;
      }

      // Caso A: Si Supabase devuelve sesión activa directamente
      if (data?.session) {
        router.replace('/home' as any);
        return;
      }

      // Caso B: Si se requiere confirmación por email
      setSuccessMessage('¡Cuenta creada con éxito! Hemos enviado un correo de confirmación a tu dirección.');
    } catch (err: any) {
      setErrorMessage('Error de conexión. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoToLogin = () => {
    router.push('/login' as any);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
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
            {/* Logo de Soltapp */}
            <View style={styles.logoContainer}>
              <LogoSoltapp width={130} height={118} />
            </View>

            {/* Título */}
            <Text style={styles.headingTitle}>Crear una nueva cuenta</Text>

            {/* Formulario */}
            <View style={styles.form}>
              {/* Input 1: Email */}
              <View style={styles.inputContainer}>
                <Feather
                  name="mail"
                  size={19}
                  color="#9098B1"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#9098B1"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    clearMessages();
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>

              {/* Input 2: Contraseña */}
              <View style={styles.inputContainer}>
                <Feather
                  name="lock"
                  size={19}
                  color="#9098B1"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Contraseña"
                  placeholderTextColor="#9098B1"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    clearMessages();
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  editable={!loading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  disabled={loading}
                >
                  <Feather
                    name={showPassword ? 'eye' : 'eye-off'}
                    size={18}
                    color="#9098B1"
                  />
                </TouchableOpacity>
              </View>

              {/* Input 3: Repetir contraseña */}
              <View style={styles.inputContainer}>
                <Feather
                  name="lock"
                  size={19}
                  color="#9098B1"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Repetir contraseña"
                  placeholderTextColor="#9098B1"
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    clearMessages();
                  }}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  editable={!loading}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  disabled={loading}
                >
                  <Feather
                    name={showConfirmPassword ? 'eye' : 'eye-off'}
                    size={18}
                    color="#9098B1"
                  />
                </TouchableOpacity>
              </View>

              {/* Mensaje de Error Integrado */}
              {errorMessage && (
                <View style={styles.errorContainer}>
                  <Feather name="alert-circle" size={17} color="#E11D48" style={styles.errorIcon} />
                  <View style={styles.errorTextContainer}>
                    <Text style={styles.errorText}>{errorMessage}{showLoginLink ? ' ' : ''}</Text>
                    {showLoginLink && (
                      <TouchableOpacity onPress={handleGoToLogin} activeOpacity={0.7}>
                        <Text style={styles.errorLink}>¿Querés ingresar?</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}

              {/* Mensaje de Éxito Integrado */}
              {successMessage && (
                <View style={styles.successContainer}>
                  <Feather name="check-circle" size={18} color="#16A34A" style={styles.successIcon} />
                  <View style={styles.successTextContainer}>
                    <Text style={styles.successText}>{successMessage}</Text>
                    <TouchableOpacity onPress={handleGoToLogin} style={styles.successButton} activeOpacity={0.7}>
                      <Text style={styles.successButtonText}>Ir a Iniciar Sesión</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Botón Principal "Registrar" */}
              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.buttonDisabled]}
                onPress={handleRegister}
                activeOpacity={0.85}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.primaryButtonText}>Registrar</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Enlace inferior para volver al Login */}
            <View style={styles.footerContainer}>
              <View style={styles.loginRow}>
                <Text style={styles.loginLabel}>¿Tenés una cuenta? </Text>
                <TouchableOpacity onPress={handleGoToLogin} activeOpacity={0.7} disabled={loading}>
                  <Text style={styles.loginLink}>Ingresá</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const PRIMARY_COLOR = '#1DE9B6'; // Color turquesa oficial de Soltapp
const TEXT_DARK = '#1F232E';
const BORDER_COLOR = '#EBF0F5';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
  },
  contentWrapper: {
    width: '100%',
    maxWidth: 420,
    paddingHorizontal: 12,
  },
  // Logo
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    height: 120,
  },
  // Heading
  headingTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: TEXT_DARK,
    textAlign: 'center',
    marginBottom: 26,
  },
  // Form Inputs
  form: {
    gap: 14,
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: 'normal',
    color: TEXT_DARK,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}),
  },
  // Error Container
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  errorIcon: {
    marginRight: 2,
  },
  errorTextContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 13,
    color: '#E11D48',
    fontWeight: '500',
  },
  errorLink: {
    fontSize: 13,
    color: '#E11D48',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  // Success Container
  successContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  successIcon: {
    marginTop: 2,
    marginRight: 2,
  },
  successTextContainer: {
    flex: 1,
    flexDirection: 'column',
    gap: 6,
  },
  successText: {
    fontSize: 13.5,
    color: '#16A34A',
    fontWeight: '500',
    lineHeight: 18,
  },
  successButton: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  successButtonText: {
    fontSize: 13.5,
    color: '#16A34A',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  // Primary Button
  primaryButton: {
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 12,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    shadowColor: PRIMARY_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  // Footer Links
  footerContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  loginRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loginLabel: {
    fontSize: 14,
    color: '#8A97A6',
  },
  loginLink: {
    fontSize: 14,
    fontWeight: 'bold',
    color: PRIMARY_COLOR,
  },
});
