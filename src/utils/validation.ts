import { z } from 'zod';

/**
 * Reglas de validación de Soltapp:
 * - Autenticación: Login, Registro, Recuperar contraseña y Cambiar contraseña.
 * - Alta de producto (UploadProductView).
 * - Carrito y Compra (CartScreen).
 *
 * No usan nada de React Native, así que se prueban directo con Jest.
 */

// Misma expresión regular que usa isValidEmail en las pantallas.
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Mínimo de caracteres de la contraseña (registro y cambio de contraseña).
export const MIN_PASSWORD_LENGTH = 8;

// Mensajes exactos que muestra la app.
export const AUTH_MESSAGES = {
  // Login y registro
  camposVacios: 'Por favor completa todos los campos.',
  emailInvalido: 'El correo es inválido',
  passwordCorta: 'La contraseña debe tener al menos 8 caracteres.',
  passwordsDistintas: 'Las contraseñas no coinciden.',
  // Recuperar contraseña (ForgotPasswordScreen)
  recuperarEmailVacio: 'Por favor ingresa tu dirección de email.',
  recuperarEmailInvalido: 'Ingresa un correo electrónico válido.',
  // Cambiar contraseña (ResetPasswordScreen)
  cambioCamposVacios: 'Por favor completa ambos campos de contraseña.',
  cambioPasswordsDistintas: 'Las contraseñas no coinciden. Verifícalas e inténtalo de nuevo.',
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

/**
 * Recuperar contraseña (handleSendCode): 1) email vacío  2) formato de email.
 * Los mensajes son distintos de los de login y registro.
 */
export const forgotPasswordSchema = z
  .object({
    email: z.string(),
  })
  .superRefine((valores, ctx) => {
    const email = valores.email.trim();

    if (!email) {
      ctx.addIssue({ code: 'custom', message: AUTH_MESSAGES.recuperarEmailVacio });
      return;
    }
    if (!EMAIL_REGEX.test(email)) {
      ctx.addIssue({ code: 'custom', path: ['email'], message: AUTH_MESSAGES.recuperarEmailInvalido });
    }
  });

/**
 * Cambiar contraseña (handleUpdatePassword):
 * 1) campos vacíos  2) 8+ caracteres  3) contraseñas iguales.
 */
export const resetPasswordSchema = z
  .object({
    password: z.string(),
    confirmPassword: z.string(),
  })
  .superRefine((valores, ctx) => {
    if (!valores.password || !valores.confirmPassword) {
      ctx.addIssue({ code: 'custom', message: AUTH_MESSAGES.cambioCamposVacios });
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
        message: AUTH_MESSAGES.cambioPasswordsDistintas,
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

// ---------------------------------------------------------------------------
// Alta de producto (UploadProductView.handlePublish)
// ---------------------------------------------------------------------------

export const PRODUCT_LIMITS = {
  titleMax: 60,
  quickInfoMax: 200,
  descriptionMax: 500,
  photosMax: 10,
} as const;

export const PRODUCT_CONDITIONS = ['nuevo', 'como_nuevo', 'bueno', 'regular'] as const;
export const PRODUCT_CURRENCIES = ['ARS', 'USD'] as const;

export const PRODUCT_MESSAGES = {
  tituloVacio: 'Por favor ingresa un título o descripción para tu anuncio.',
  categoriaVacia: 'Por favor selecciona una categoría para tu producto.',
  precioInvalido: 'Por favor ingresa un precio válido mayor a 0.',
  tituloLargo: 'El título no puede superar los 60 caracteres.',
  descripcionLarga: 'La descripción no puede superar los 500 caracteres.',
  infoLarga: 'La información rápida no puede superar los 200 caracteres.',
  demasiadasFotos: 'Se permiten hasta 10 fotos.',
  monedaInvalida: 'La moneda debe ser ARS o USD.',
  condicionInvalida: 'El estado del producto no es válido.',
} as const;

export function parsePrecio(texto: string): number {
  return parseFloat(texto.replace(/[^0-9.]/g, ''));
}

export const productSchema = z
  .object({
    title: z.string(),
    quickInfo: z.string(),
    description: z.string(),
    categoryId: z.number().nullable(),
    price: z.string(),
    currency: z.string(),
    condition: z.string(),
    photos: z.array(z.string()),
  })
  .superRefine((valores, ctx) => {
    if (!valores.title.trim() && !valores.quickInfo.trim()) {
      ctx.addIssue({ code: 'custom', path: ['title'], message: PRODUCT_MESSAGES.tituloVacio });
      return;
    }
    if (valores.categoryId === null) {
      ctx.addIssue({ code: 'custom', path: ['categoryId'], message: PRODUCT_MESSAGES.categoriaVacia });
      return;
    }
    const precio = parsePrecio(valores.price);
    if (Number.isNaN(precio) || precio <= 0) {
      ctx.addIssue({ code: 'custom', path: ['price'], message: PRODUCT_MESSAGES.precioInvalido });
      return;
    }
    if (valores.title.length > PRODUCT_LIMITS.titleMax) {
      ctx.addIssue({ code: 'custom', path: ['title'], message: PRODUCT_MESSAGES.tituloLargo });
      return;
    }
    if (valores.description.length > PRODUCT_LIMITS.descriptionMax) {
      ctx.addIssue({ code: 'custom', path: ['description'], message: PRODUCT_MESSAGES.descripcionLarga });
      return;
    }
    if (valores.quickInfo.length > PRODUCT_LIMITS.quickInfoMax) {
      ctx.addIssue({ code: 'custom', path: ['quickInfo'], message: PRODUCT_MESSAGES.infoLarga });
      return;
    }
    if (!(PRODUCT_CURRENCIES as readonly string[]).includes(valores.currency)) {
      ctx.addIssue({ code: 'custom', path: ['currency'], message: PRODUCT_MESSAGES.monedaInvalida });
      return;
    }
    if (!(PRODUCT_CONDITIONS as readonly string[]).includes(valores.condition)) {
      ctx.addIssue({ code: 'custom', path: ['condition'], message: PRODUCT_MESSAGES.condicionInvalida });
      return;
    }
    if (valores.photos.length > PRODUCT_LIMITS.photosMax) {
      ctx.addIssue({ code: 'custom', path: ['photos'], message: PRODUCT_MESSAGES.demasiadasFotos });
    }
  });

// ---------------------------------------------------------------------------
// Carrito y Compra (CartScreen)
// ---------------------------------------------------------------------------

export const cartValidationSchema = z
  .object({
    productId: z.string(),
    sellerId: z.string(),
    title: z.string(),
    price: z.string(),
    paymentMethod: z.string(),
  })
  .superRefine((valores, ctx) => {
    if (!valores.productId.trim() || !valores.sellerId.trim()) {
      ctx.addIssue({ code: 'custom', message: 'El ID del producto y del vendedor son requeridos.' });
      return;
    }
    // Si contiene el signo menos explícitamente, o el número parseado es menor a 0
    const tieneSignoNegativo = valores.price.includes('-');
    const precio = parsePrecio(valores.price);
    
    if (tieneSignoNegativo || Number.isNaN(precio) || precio < 0) {
      ctx.addIssue({ code: 'custom', path: ['price'], message: 'El precio debe ser un número no negativo.' });
    }
  });