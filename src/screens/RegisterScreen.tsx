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
  Alert,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../supabase';

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

  // Validación de formato de correo con expresión regular (RegEx)
  const isValidEmail = (emailStr: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailStr);
  };

  // Validación de complejidad de contraseña (8+ caracteres, mayúscula, minúscula, número y carácter especial)
  const validatePasswordComplexity = (pass: string): { isValid: boolean; message?: string } => {
    if (pass.length < 8) {
      return { isValid: false, message: 'La contraseña debe tener al menos 8 caracteres.' };
    }
    if (!/[A-Z]/.test(pass)) {
      return { isValid: false, message: 'La contraseña debe contener al menos una letra mayúscula.' };
    }
    if (!/[a-z]/.test(pass)) {
      return { isValid: false, message: 'La contraseña debe contener al menos una letra minúscula.' };
    }
    if (!/\d/.test(pass)) {
      return { isValid: false, message: 'La contraseña debe contener al menos un número.' };
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(pass)) {
      return { isValid: false, message: 'La contraseña debe contener al menos un carácter especial (ej: !@#$%&*).' };
    }
    return { isValid: true };
  };

  // Mapeo de errores comunes de Supabase a mensajes claros en español
  const getFriendlyErrorMessage = (errorMsg: string): string => {
    const msg = errorMsg.toLowerCase();
    if (
      msg.includes('user already registered') ||
      msg.includes('already registered') ||
      msg.includes('user_already_exists')
    ) {
      return 'Este correo electrónico ya se encuentra registrado. Por favor inicia sesión.';
    }
    if (msg.includes('invalid email') || msg.includes('email address is invalid')) {
      return 'El formato del correo electrónico ingresado no es válido.';
    }
    if (msg.includes('rate limit') || msg.includes('too many requests')) {
      return 'Has realizado demasiados intentos. Por favor espera unos minutos antes de volver a intentar.';
    }
    if (msg.includes('password should be at least')) {
      return 'La contraseña no cumple con la longitud mínima requerida por el sistema.';
    }
    return errorMsg || 'Ocurrió un error al intentar crear la cuenta.';
  };

  // Lógica de registro y validaciones
  const handleRegister = async () => {
    const trimmedEmail = email.trim();

    // 1. Validar campos obligatorios
    if (!trimmedEmail || !password || !confirmPassword) {
      Alert.alert('Campos incompletos', 'Por favor completa todos los campos para continuar.');
      return;
    }

    // 2. Validar formato de correo electrónico
    if (!isValidEmail(trimmedEmail)) {
      Alert.alert(
        'Correo inválido',
        'Por favor ingresa una dirección de correo electrónico válida (ej: usuario@ejemplo.com).'
      );
      return;
    }

    // 3. Validar robustez de la contraseña
    const passwordCheck = validatePasswordComplexity(password);
    if (!passwordCheck.isValid) {
      Alert.alert('Contraseña débil', passwordCheck.message);
      return;
    }

    // 4. Validar coincidencia de contraseñas
    if (password !== confirmPassword) {
      Alert.alert('Contraseñas no coinciden', 'Las contraseñas ingresadas no coinciden. Por favor verifícalas.');
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password: password,
      });

      if (error) {
        Alert.alert('Error en el registro', getFriendlyErrorMessage(error.message));
        return;
      }

      // Si Supabase devuelve sesión activa directamente
      if (data?.session) {
        Alert.alert('¡Registro exitoso!', 'Tu cuenta ha sido creada e iniciada correctamente.', [
          { text: 'Comenzar', onPress: () => router.push('/home' as any) },
        ]);
      } else {
        // Si se requiere confirmación por email
        Alert.alert(
          '¡Cuenta creada con éxito!',
          'Hemos enviado un correo de confirmación a tu dirección. Por favor verifica tu bandeja de entrada antes de iniciar sesión.',
          [
            {
              text: 'Ir a Iniciar Sesión',
              onPress: () => router.push('/login' as any),
            },
          ]
        );
      }
    } catch (err: any) {
      Alert.alert('Error inesperado', getFriendlyErrorMessage(err?.message || ''));
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
                  onChangeText={setEmail}
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
                  onChangeText={setPassword}
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
                  onChangeText={setConfirmPassword}
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
  // Primary Button
  primaryButton: {
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 12,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
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
