import {
    AUTH_MESSAGES,
    EMAIL_REGEX,
    loginSchema,
    primerError,
    registerSchema,
} from '../src/utils/validation';

const registroValido = {
  fullName: 'Ana Pérez',
  email: 'ana@correo.com',
  password: '12345678',
  confirmPassword: '12345678',
};

describe('Formato de email (EMAIL_REGEX)', () => {
  it.each(['a@b.co', 'ana@correo.com', 'ana.perez+tag@dominio.com.ar'])(
    'acepta "%s"',
    (email) => {
      expect(EMAIL_REGEX.test(email)).toBe(true);
    }
  );

  it.each(['usuario@', 'usuario@correo', '@correo.com', 'a@@correo.com', 'a b@correo.com', 'a@correo.'])(
    'rechaza "%s"',
    (email) => {
      expect(EMAIL_REGEX.test(email)).toBe(false);
    }
  );
});

describe('Login (AUT-08 a AUT-10)', () => {
  it('AUT-08: acepta email y contraseña válidos', () => {
    const resultado = loginSchema.safeParse({ email: 'ana@correo.com', password: 'cualquiera' });
    expect(resultado.success).toBe(true);
  });

  it('AUT-09: rechaza el email vacío', () => {
    const resultado = loginSchema.safeParse({ email: '', password: '12345678' });
    expect(primerError(resultado)).toBe(AUTH_MESSAGES.camposVacios);
  });

  it('AUT-09: rechaza la contraseña vacía', () => {
    const resultado = loginSchema.safeParse({ email: 'ana@correo.com', password: '' });
    expect(primerError(resultado)).toBe(AUTH_MESSAGES.camposVacios);
  });

  it('AUT-09: rechaza ambos campos vacíos', () => {
    const resultado = loginSchema.safeParse({ email: '', password: '' });
    expect(primerError(resultado)).toBe(AUTH_MESSAGES.camposVacios);
  });

  it('AUT-09: un email de solo espacios cuenta como vacío', () => {
    const resultado = loginSchema.safeParse({ email: '   ', password: '12345678' });
    expect(primerError(resultado)).toBe(AUTH_MESSAGES.camposVacios);
  });

  it('AUT-10: rechaza un email con formato inválido', () => {
    const resultado = loginSchema.safeParse({ email: 'usuario@', password: '12345678' });
    expect(primerError(resultado)).toBe(AUTH_MESSAGES.emailInvalido);
  });

  it('prioriza "campos vacíos" sobre "email inválido"', () => {
    const resultado = loginSchema.safeParse({ email: 'usuario@', password: '' });
    expect(primerError(resultado)).toBe(AUTH_MESSAGES.camposVacios);
  });

  it('ignora los espacios alrededor de un email válido', () => {
    const resultado = loginSchema.safeParse({ email: '  ana@correo.com  ', password: '12345678' });
    expect(resultado.success).toBe(true);
  });

  it('el login no exige largo mínimo de contraseña', () => {
    const resultado = loginSchema.safeParse({ email: 'ana@correo.com', password: '1' });
    expect(resultado.success).toBe(true);
  });
});

describe('Registro (AUT-01 a AUT-05)', () => {
  it('AUT-01: acepta datos válidos', () => {
    expect(registerSchema.safeParse(registroValido).success).toBe(true);
  });

  it.each(['fullName', 'email', 'password', 'confirmPassword'] as const)(
    'AUT-02: rechaza el campo vacío "%s"',
    (campo) => {
      const resultado = registerSchema.safeParse({ ...registroValido, [campo]: '' });
      expect(primerError(resultado)).toBe(AUTH_MESSAGES.camposVacios);
    }
  );

  it('AUT-02: un nombre de solo espacios cuenta como vacío', () => {
    const resultado = registerSchema.safeParse({ ...registroValido, fullName: '   ' });
    expect(primerError(resultado)).toBe(AUTH_MESSAGES.camposVacios);
  });

  it('AUT-03: rechaza un email con formato inválido', () => {
    const resultado = registerSchema.safeParse({ ...registroValido, email: 'ana@correo' });
    expect(primerError(resultado)).toBe(AUTH_MESSAGES.emailInvalido);
  });

  it('AUT-04: rechaza una contraseña de 7 caracteres', () => {
    const resultado = registerSchema.safeParse({
      ...registroValido,
      password: '1234567',
      confirmPassword: '1234567',
    });
    expect(primerError(resultado)).toBe(AUTH_MESSAGES.passwordCorta);
  });

  it('AUT-04: acepta una contraseña de exactamente 8 caracteres (límite)', () => {
    const resultado = registerSchema.safeParse({
      ...registroValido,
      password: '12345678',
      confirmPassword: '12345678',
    });
    expect(resultado.success).toBe(true);
  });

  it('AUT-05: rechaza contraseñas que no coinciden', () => {
    const resultado = registerSchema.safeParse({ ...registroValido, confirmPassword: '87654321' });
    expect(primerError(resultado)).toBe(AUTH_MESSAGES.passwordsDistintas);
  });

  it('prioriza el email inválido sobre la contraseña corta', () => {
    const resultado = registerSchema.safeParse({
      ...registroValido,
      email: 'ana@correo',
      password: '123',
      confirmPassword: '123',
    });
    expect(primerError(resultado)).toBe(AUTH_MESSAGES.emailInvalido);
  });

  it('prioriza la contraseña corta sobre la diferencia entre contraseñas', () => {
    const resultado = registerSchema.safeParse({
      ...registroValido,
      password: '123',
      confirmPassword: '456',
    });
    expect(primerError(resultado)).toBe(AUTH_MESSAGES.passwordCorta);
  });
});