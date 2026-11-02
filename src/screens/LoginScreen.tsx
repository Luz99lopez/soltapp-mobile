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
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { supabase, SUPABASE_URL } from '../supabase';
import { getAuthRedirectUri, resetWebAuthAccess } from '../utils/auth';
import { withAuthTimeout } from '../utils/authTimeout';
import { NativeOAuthError, runNativeOAuth } from '../services/nativeOAuthService';

// Componentes SVG vectoriales oficiales
import LogoSoltapp from '../../assets/svgs/logotipo color.svg';
import GoogleIcon from '../../assets/svgs/Google.svg';
import FacebookIcon from '../../assets/svgs/Facebook.svg';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const { authError } = useLocalSearchParams<{ authError?: string }>();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'facebook' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(authError === 'session-timeout' ? 'La sesión guardada no respondió a tiempo. Podés restablecer el acceso de este navegador y volver a iniciar sesión.' : null);
  const [allowLocalReset, setAllowLocalReset] = useState(authError === 'session-timeout');
  const nativeAttempt = React.useRef<AbortController | null>(null);
  const mounted = React.useRef(true);

  React.useEffect(() => {
    mounted.current = true;
    // Expo Router puede abrir /home por el enlace antes de terminar setSession.
    // Conservar ese intercambio al desmontar; el servicio limita la espera y limpia
    // su observador. La cancelación explícita sí invalida los retornos tardíos.
    return () => { mounted.current = false; };
  }, []);

  // Redirección automática si el usuario ya está autenticado o completa OAuth
  React.useEffect(() => {
    let active = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // El flujo nativo registra y comprueba la sesión antes de navegar.
      if (Platform.OS !== 'web' && nativeAttempt.current) return;
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
        router.replace('/home' as any);
      }
    });

    withAuthTimeout(supabase.auth.getSession()).then(({ data: { session } }) => {
      if (active && session && !(Platform.OS !== 'web' && nativeAttempt.current)) {
        router.replace('/home' as any);
      }
    }).catch(reason => {
      if (active) { setErrorMessage(reason.message || 'No se pudo recuperar la sesión guardada.'); setAllowLocalReset(true); }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [router]);

  // Validación de formato de correo con expresión regular (RegEx)
  const isValidEmail = (emailStr: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailStr);
  };

  // Inicio de sesión con Email y Contraseña (Supabase)
  const handleLogin = async () => {
    setErrorMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setErrorMessage('Por favor completa todos los campos.');
      return;
    }

    // 1. Validación de formato de correo (Regex)
    if (!isValidEmail(trimmedEmail)) {
      setErrorMessage('El correo es inválido');
      return;
    }

    setLoading(true);
    try {
      // Auth es la fuente de identidad; RLS puede ocultar perfiles a usuarios sin sesión.
      const { data, error } = await withAuthTimeout(supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      }));

      if (error) {
        const errorMsg = (error.message || '').toLowerCase();
        const errorCode = ((error as any).code || '').toLowerCase();
        const status = error.status || (error as any).statusCode;
        
        // Caso 1: Error explícito de contraseña incorrecta
        if (
          errorMsg.includes('wrong password') ||
          errorMsg.includes('invalid password') ||
          errorMsg.includes('incorrect password')
        ) {
          setErrorMessage('La contraseña es incorrecta');
        }
        // Caso 2: Usuario / Correo no registrado
        else if (
          errorMsg.includes('user not found') ||
          errorMsg.includes('not registered') ||
          errorMsg.includes('user_not_found') ||
          errorMsg.includes('no user') ||
          errorMsg.includes('email not found') ||
          errorCode === 'user_not_found' ||
          errorCode === 'user_not_registered'
        ) {
          setErrorMessage('El correo no está registrado');
        } 
        // Caso 3: Credenciales inválidas (contraseña errónea o usuario registrado con Google/Facebook OAuth sin password)
        else if (
          errorMsg.includes('invalid login credentials') ||
          errorMsg.includes('invalid_grant') ||
          errorMsg.includes('invalid credentials') ||
          errorCode === 'invalid_credentials' ||
          errorCode === 'invalid_grant' ||
          status === 401 ||
          status === 400
        ) {
          setErrorMessage('Usuario o contraseña incorrectos. Si te registraste con otro método, iniciá sesión con Google o Facebook.');
        } 
        // Caso 4: Email aún no confirmado
        else if (
          errorMsg.includes('email not confirmed') ||
          errorMsg.includes('email_not_confirmed') ||
          errorCode === 'email_not_confirmed'
        ) {
          setErrorMessage('El correo electrónico aún no ha sido confirmado. Por favor verifica tu bandeja de entrada.');
        } 
        // Caso 5: Límite de intentos (Rate limit)
        else if (
          errorMsg.includes('rate limit') ||
          errorMsg.includes('too many requests') ||
          status === 429
        ) {
          setErrorMessage('Demasiados intentos. Espera unos minutos.');
        } 
        // Caso por defecto
        else {
          setErrorMessage('Usuario o contraseña incorrectos. Si te registraste con otro método, iniciá sesión con Google o Facebook.');
        }
      } else if (data?.session) {
        // Redirección exitosa
        router.replace('/home' as any);
      } else {
        setErrorMessage('Usuario o contraseña incorrectos. Si te registraste con otro método, iniciá sesión con Google o Facebook.');
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Ocurrió un error de conexión. Inténtalo de nuevo.');
      if (err instanceof Error && err.name === 'AuthTimeoutError') setAllowLocalReset(true);
    } finally {
      setLoading(false);
    }
  };

  // Inicio de sesión Social (Google / Facebook) con Supabase OAuth
  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    if (Platform.OS !== 'web' && nativeAttempt.current) return;
    const attempt = Platform.OS !== 'web' ? new AbortController() : null;
    if (attempt) nativeAttempt.current = attempt;
    try {
      setSocialLoading(provider);
      setErrorMessage(null);

      // Genera dinámicamente la URL de redirección (auth.soltapp.com.ar, localhost o esquema nativo)
      const redirectUrl = getAuthRedirectUri(Platform.OS === 'web' ? 'auth/callback' : 'home');

      if (Platform.OS === 'web') {
        // Controlar el redirect aquí evita que una respuesta tardía navegue tras un timeout.
        const { data, error } = await withAuthTimeout(supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: redirectUrl,
            skipBrowserRedirect: true,
            queryParams: {
              prompt: 'select_account',
            },
          },
        }));
        if (error) throw error;
        if (!data.url) throw new Error('No se recibió una URL para abrir el proveedor.');
        window.location.assign(data.url);
        return;
      }

      // Mismo OAuth nativo: límites de espera y retorno validado.
      if (!attempt) return;
      await runNativeOAuth(provider, redirectUrl, {
        signal: attempt.signal,
      });
      if (mounted.current && !attempt.signal.aborted) router.replace('/home' as any);
    } catch (err: any) {
      if (Platform.OS === 'web') {
        setErrorMessage(err.message || `No se pudo autenticar con ${provider}.`);
        if (err.name === 'AuthTimeoutError') setAllowLocalReset(true);
      } else if (mounted.current) {
        setErrorMessage(err instanceof NativeOAuthError ? err.message : 'No se pudo iniciar sesión. Volvé a intentar.');
      }
    } finally {
      if (nativeAttempt.current === attempt) nativeAttempt.current = null;
      if (mounted.current) setSocialLoading(null);
    }
  };

  const handleForgotPassword = () => {
    router.push('/forgot-password' as any);
  };

  const handleGoToRegister = () => {
    router.push('/register' as any);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
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
            {/* Logotipo SVG oficial de Soltapp */}
            <View style={styles.logoContainer}>
              <LogoSoltapp width={130} height={118} />
            </View>

            {/* Título */}
            <Text style={styles.headingTitle}>Logueate para continuar</Text>

            {/* Formulario */}
            <View style={styles.form}>
              {/* Input Email */}
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
                    if (errorMessage) setErrorMessage(null);
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>

              {/* Input Contraseña */}
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
                    if (errorMessage) setErrorMessage(null);
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  editable={!loading}
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

              {/* Mensaje de Error Integrado */}
              {errorMessage && (
                <View style={styles.errorContainer}>
                  <Feather name="alert-circle" size={17} color="#E11D48" style={styles.errorIcon} />
                  <View style={styles.errorTextContainer}>
                    <Text accessibilityRole="alert" style={styles.errorText}>{errorMessage}</Text>
                  </View>
                </View>
              )}
              {allowLocalReset && Platform.OS === 'web' && <TouchableOpacity accessibilityRole="button" onPress={() => {
                try { resetWebAuthAccess(SUPABASE_URL); }
                catch { setErrorMessage('No se pudo restablecer el acceso guardado. Probá abrir Soltapp en una ventana nueva del navegador.'); }
              }} style={{ paddingVertical: 12 }}><Text style={{ color: '#0D9488', fontWeight: '600', textAlign: 'center' }}>Restablecer acceso en este navegador</Text></TouchableOpacity>}

              {/* Botón Principal "Ingresá" */}
              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.buttonDisabled]}
                onPress={handleLogin}
                activeOpacity={0.85}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.primaryButtonText}>Ingresá</Text>
                )}
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

            {/* Botones Sociales con Componentes SVG y Supabase OAuth */}
            <View style={styles.socialButtonsContainer}>
              {/* Botón Google */}
              <TouchableOpacity
                style={[styles.socialButton, socialLoading === 'google' && styles.buttonDisabled]}
                onPress={() => handleSocialLogin('google')}
                activeOpacity={0.7}
                disabled={socialLoading !== null}
              >
                {socialLoading === 'google' ? (
                  <><ActivityIndicator color="#EA4335" size="small" /><Text style={styles.socialButtonText}>Abriendo Google...</Text></>
                ) : (
                  <>
                    <View style={styles.socialIconWrapper}>
                      <GoogleIcon width={20} height={20} />
                    </View>
                    <Text style={styles.socialButtonText}>Ingresá con google</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Botón Facebook */}
              <TouchableOpacity
                style={[styles.socialButton, socialLoading === 'facebook' && styles.buttonDisabled]}
                onPress={() => handleSocialLogin('facebook')}
                activeOpacity={0.7}
                disabled={socialLoading !== null}
              >
                {socialLoading === 'facebook' ? (
                  <><ActivityIndicator color="#1877F2" size="small" /><Text style={styles.socialButtonText}>Abriendo Facebook...</Text></>
                ) : (
                  <>
                    <View style={styles.socialIconWrapper}>
                      <FacebookIcon width={20} height={20} />
                    </View>
                    <Text style={styles.socialButtonText}>Ingresá con Facebook</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {Platform.OS !== 'web' && socialLoading && (
              <TouchableOpacity accessibilityRole="button" onPress={() => nativeAttempt.current?.abort()} style={{ paddingVertical: 12 }}>
                <Text style={{ color: '#0D9488', textAlign: 'center' }}>Cancelar inicio de sesión</Text>
              </TouchableOpacity>
            )}
            {/* Enlaces de pie de pantalla */}
            <View style={styles.footerContainer}>
              <TouchableOpacity
                onPress={handleForgotPassword}
                activeOpacity={0.7}
              >
                <Text style={styles.forgotPasswordText}>
                  Olvidaste tu contraseña?
                </Text>
              </TouchableOpacity>

              <View style={styles.registerRow}>
                <Text style={styles.registerLabel}>No tenes una cuenta?. </Text>
                <TouchableOpacity onPress={handleGoToRegister} activeOpacity={0.7}>
                  <Text style={styles.registerLink}>Registrate</Text>
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
    marginBottom: 20,
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
    color: '#9098B1',
    fontWeight: '600',
  },
  // Social Buttons
  socialButtonsContainer: {
    gap: 12,
    marginBottom: 28,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 12,
    height: 50,
    paddingHorizontal: 16,
  },
  socialIconWrapper: {
    marginRight: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#64748B',
  },
  // Footer Links
  footerContainer: {
    alignItems: 'center',
    gap: 12,
  },
  forgotPasswordText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: PRIMARY_COLOR,
  },
  registerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  registerLabel: {
    fontSize: 13.5,
    color: '#8A97A6',
  },
  registerLink: {
    fontSize: 13.5,
    fontWeight: 'bold',
    color: PRIMARY_COLOR,
  },
});
