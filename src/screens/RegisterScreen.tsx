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
  Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function RegisterScreen() {
  const router = useRouter();

  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const handleRegister = () => {
    if (!fullName.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert('Campos incompletos', 'Por favor llena todos los campos para continuar.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert('¡Registro exitoso!', `Bienvenido a Soltapp, ${fullName}.`, [
        {
          text: 'Continuar',
          onPress: () => router.push('/login' as any),
        },
      ]);
    }, 1000);
  };

  const handleGoogleSignup = () => {
    Alert.alert('Google Auth', 'Iniciando registro con Google...');
  };

  const handleFacebookSignup = () => {
    Alert.alert('Facebook Auth', 'Iniciando registro con Facebook...');
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
              <Image
                source={require('../../assets/images/logotipo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>

            {/* Título */}
            <Text style={styles.headingTitle}>Creá tu cuenta</Text>

            {/* Formulario */}
            <View style={styles.form}>
              {/* Input Nombre Completo */}
              <View style={styles.inputContainer}>
                <Feather
                  name="user"
                  size={18}
                  color="#9098B1"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Nombre completo"
                  placeholderTextColor="#9098B1"
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                />
              </View>

              {/* Input Email */}
              <View style={styles.inputContainer}>
                <Feather
                  name="mail"
                  size={18}
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
                />
              </View>

              {/* Input Contraseña */}
              <View style={styles.inputContainer}>
                <Feather
                  name="lock"
                  size={18}
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
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Feather
                    name={showPassword ? 'eye' : 'eye-off'}
                    size={18}
                    color="#9098B1"
                  />
                </TouchableOpacity>
              </View>

              {/* Input Confirmar Contraseña */}
              <View style={styles.inputContainer}>
                <Feather
                  name="lock"
                  size={18}
                  color="#9098B1"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Confirmar contraseña"
                  placeholderTextColor="#9098B1"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Feather
                    name={showConfirmPassword ? 'eye' : 'eye-off'}
                    size={18}
                    color="#9098B1"
                  />
                </TouchableOpacity>
              </View>

              {/* Botón Principal "Registrate" */}
              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.buttonDisabled]}
                onPress={handleRegister}
                activeOpacity={0.85}
                disabled={loading}
              >
                <Text style={styles.primaryButtonText}>
                  {loading ? 'Registrando...' : 'Registrate'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Divisor con la "o" */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <View style={styles.dividerCircle}>
                <Text style={styles.dividerText}>o</Text>
              </View>
              <View style={styles.dividerLine} />
            </View>

            {/* Botones Sociales */}
            <View style={styles.socialButtonsContainer}>
              {/* Google */}
              <TouchableOpacity
                style={styles.socialButton}
                onPress={handleGoogleSignup}
                activeOpacity={0.7}
              >
                <Feather
                  name="globe"
                  size={18}
                  color="#EA4335"
                  style={styles.socialIcon}
                />
                <Text style={styles.socialButtonText}>Registrate con google</Text>
              </TouchableOpacity>

              {/* Facebook */}
              <TouchableOpacity
                style={styles.socialButton}
                onPress={handleFacebookSignup}
                activeOpacity={0.7}
              >
                <Feather
                  name="facebook"
                  size={18}
                  color="#4092FF"
                  style={styles.socialIcon}
                />
                <Text style={styles.socialButtonText}>Registrate con Facebook</Text>
              </TouchableOpacity>
            </View>

            {/* Enlace al Login */}
            <View style={styles.footerContainer}>
              <View style={styles.loginRow}>
                <Text style={styles.loginLabel}>¿Ya tenés una cuenta?. </Text>
                <TouchableOpacity onPress={handleGoToLogin} activeOpacity={0.7}>
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

const PRIMARY_TEAL = '#3BD7C2';
const TEXT_NAVY = '#1F232E';
const BORDER_NEUTRAL = '#9098B1';
const INPUT_BG = '#F9FAFB';

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
    height: 125,
  },
  logoImage: {
    width: 140,
    height: 125,
    resizeMode: 'contain',
  },
  // Heading
  headingTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: TEXT_NAVY,
    textAlign: 'center',
    marginBottom: 24,
  },
  // Form Inputs
  form: {
    gap: 14,
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: INPUT_BG,
    borderWidth: 1,
    borderColor: '#EBF0F5',
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
    color: TEXT_NAVY,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}),
  },
  // Primary Button
  primaryButton: {
    backgroundColor: PRIMARY_TEAL,
    borderRadius: 12,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    shadowColor: PRIMARY_TEAL,
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
  // Divider
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#EBF0F5',
  },
  dividerCircle: {
    paddingHorizontal: 14,
  },
  dividerText: {
    fontSize: 14,
    color: BORDER_NEUTRAL,
    fontWeight: '600',
  },
  // Social Buttons
  socialButtonsContainer: {
    gap: 12,
    marginBottom: 26,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBF0F5',
    borderRadius: 12,
    height: 50,
    paddingHorizontal: 16,
  },
  socialIcon: {
    marginRight: 10,
  },
  socialButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#64748B',
  },
  // Footer Links
  footerContainer: {
    alignItems: 'center',
    marginTop: 4,
  },
  loginRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loginLabel: {
    fontSize: 13.5,
    color: '#8A97A6',
  },
  loginLink: {
    fontSize: 13.5,
    fontWeight: 'bold',
    color: PRIMARY_TEAL,
  },
});
