/** El SDK puede esperar una sesión/renovación previa; la UI nunca debe esperar sin límite. */
export async function withAuthTimeout<T>(operation: Promise<T>, milliseconds = 15000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => {
          const error = new Error('La autenticación no respondió a tiempo. Revisá la conexión o restablecé el acceso guardado en este navegador.');
          error.name = 'AuthTimeoutError';
          reject(error);
        }, milliseconds);
      }),
    ]);
  } finally { if (timer) clearTimeout(timer); }
}
