import { z } from 'zod';

/**
 * Reglas de validación de Login y Registro de Soltapp.
 *
 * Copian las reglas que hoy están escritas dentro de
 * src/screens/LoginScreen.tsx y src/screens/RegisterScreen.tsx.
 * No usan nada de React Native, así que se prueban directo con Jest.
 */

// Misma expresión regular que usa isValidEmail en las dos pantallas.
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Mínimo de caracteres de la contraseña en el registro.
export const MIN_PASSWORD_LENGTH = 8;

// Mensajes exactos que muestra la app.
export const AUTH_MESSAGES = {
  camposVacios: 'Por favor completa todos los campos.',
  emailInvalido: 'El correo es inválido',
  passwordCorta: 'La contraseña debe tener al menos 8 caracteres.',
  passwordsDistintas: 'Las contraseñas no coinciden.',
} as const;

/**
 * Login: primero se revisan los campos vacíos y después el formato del email.
 * El login NO exige largo mínimo de contraseña.
 */
export const loginSchema = z
  .object({
    email: z.string(),
    password: z.string(),
  })
  .superRefine((valores, ctx) => {
    const email = valores.email.trim();

    if (!email || !valores.password) {
      ctx.addIssue({ code: 'custom', message: AUTH_MESSAGES.camposVacios });
      return;
    }
    if (!EMAIL_REGEX.test(email)) {
      ctx.addIssue({ code: 'custom', path: ['email'], message: AUTH_MESSAGES.emailInvalido });
    }
  });

/**
 * Registro: orden de las reglas, igual que en handleRegister:
 * 1) campos vacíos  2) formato de email  3) contraseña de 8+ caracteres  4) contraseñas iguales.
 */
export const registerSchema = z
  .object({
    fullName: z.string(),
    email: z.string(),
    password: z.string(),
    confirmPassword: z.string(),
  })
  .superRefine((valores, ctx) => {
    const nombre = valores.fullName.trim();
    const email = valores.email.trim();

    if (!nombre || !email || !valores.password || !valores.confirmPassword) {
      ctx.addIssue({ code: 'custom', message: AUTH_MESSAGES.camposVacios });
      return;
    }
    if (!EMAIL_REGEX.test(email)) {
      ctx.addIssue({ code: 'custom', path: ['email'], message: AUTH_MESSAGES.emailInvalido });
      return;
    }
    if (valores.password.length < MIN_PASSWORD_LENGTH) {
      ctx.addIssue({ code: 'custom', path: ['password'], message: AUTH_MESSAGES.passwordCorta });
      return;
    }
    if (valores.password !== valores.confirmPassword) {
      ctx.addIssue({
        code: 'custom',
        path: ['confirmPassword'],
        message: AUTH_MESSAGES.passwordsDistintas,
      });
    }
  });

/** Devuelve el primer mensaje de error de un resultado de safeParse, o null si es válido. */
export function primerError(resultado: {
  success: boolean;
  error?: { issues: ReadonlyArray<{ message: string }> };
}): string | null {
  if (resultado.success) return null;
  return resultado.error?.issues[0]?.message ?? null;
}