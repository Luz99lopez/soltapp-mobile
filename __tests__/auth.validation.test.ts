  import {
  AUTH_MESSAGES,
  EMAIL_REGEX,
  forgotPasswordSchema,
  loginSchema,
  primerError,
  registerSchema,
  resetPasswordSchema,
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

describe('Cambio de contraseña (AUT-22 a AUT-24)', () => {
  const cambioValido = { password: '12345678', confirmPassword: '12345678' };

  it('acepta dos contraseñas iguales de 8 caracteres', () => {
    expect(resetPasswordSchema.safeParse(cambioValido).success).toBe(true);
  });

  it.each(['password', 'confirmPassword'] as const)(
    'AUT-22: rechaza el campo vacío "%s"',
    (campo) => {
      const resultado = resetPasswordSchema.safeParse({ ...cambioValido, [campo]: '' });
      expect(primerError(resultado)).toBe(AUTH_MESSAGES.cambioCamposVacios);
    }
  );

  it('AUT-22: rechaza ambos campos vacíos', () => {
    const resultado = resetPasswordSchema.safeParse({ password: '', confirmPassword: '' });
    expect(primerError(resultado)).toBe(AUTH_MESSAGES.cambioCamposVacios);
  });

  it('AUT-23: rechaza una contraseña de 7 caracteres', () => {
    const resultado = resetPasswordSchema.safeParse({ password: '1234567', confirmPassword: '1234567' });
    expect(primerError(resultado)).toBe(AUTH_MESSAGES.passwordCorta);
  });

  it('AUT-23: acepta una contraseña de exactamente 8 caracteres (límite)', () => {
    expect(resetPasswordSchema.safeParse({ password: 'abcdefgh', confirmPassword: 'abcdefgh' }).success).toBe(true);
  });

  it('AUT-24: rechaza contraseñas que no coinciden con el mensaje propio de esta pantalla', () => {
    const resultado = resetPasswordSchema.safeParse({ password: '12345678', confirmPassword: '87654321' });
    expect(primerError(resultado)).toBe(AUTH_MESSAGES.cambioPasswordsDistintas);
  });

  it('el mensaje de contraseñas distintas no es el mismo que en el registro', () => {
    expect(AUTH_MESSAGES.cambioPasswordsDistintas).not.toBe(AUTH_MESSAGES.passwordsDistintas);
  });

  it('prioriza la contraseña corta sobre la diferencia entre contraseñas', () => {
    const resultado = resetPasswordSchema.safeParse({ password: '123', confirmPassword: '456' });
    expect(primerError(resultado)).toBe(AUTH_MESSAGES.passwordCorta);
  });
});

describe('Recuperar contraseña (AUT-28 y AUT-29)', () => {
  it('acepta un email válido', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'ana@correo.com' }).success).toBe(true);
  });

  it('ignora los espacios alrededor de un email válido', () => {
    expect(forgotPasswordSchema.safeParse({ email: '  ana@correo.com  ' }).success).toBe(true);
  });

  it('AUT-28: rechaza el email vacío', () => {
    const resultado = forgotPasswordSchema.safeParse({ email: '' });
    expect(primerError(resultado)).toBe(AUTH_MESSAGES.recuperarEmailVacio);
  });

  it('AUT-28: un email de solo espacios cuenta como vacío', () => {
    const resultado = forgotPasswordSchema.safeParse({ email: '   ' });
    expect(primerError(resultado)).toBe(AUTH_MESSAGES.recuperarEmailVacio);
  });

  it('AUT-29: rechaza un email con formato inválido', () => {
    const resultado = forgotPasswordSchema.safeParse({ email: 'usuario@' });
    expect(primerError(resultado)).toBe(AUTH_MESSAGES.recuperarEmailInvalido);
  });

  it('el mensaje de email inválido no es el mismo que en login y registro', () => {
    expect(AUTH_MESSAGES.recuperarEmailInvalido).not.toBe(AUTH_MESSAGES.emailInvalido);
  });
});