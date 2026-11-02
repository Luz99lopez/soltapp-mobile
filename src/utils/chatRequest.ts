/** Un timeout de envío no confirma si el servidor guardó el mensaje: reusar client_id. */
export async function withChatTimeout<T>(operation: PromiseLike<T> & { abortSignal?: (signal: AbortSignal) => PromiseLike<T> }, milliseconds = 15000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const controller = operation.abortSignal ? new AbortController() : undefined;
  const pending = controller ? operation.abortSignal!(controller.signal) : operation;
  try {
    return await Promise.race([
      Promise.resolve(pending),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          const error = new Error('El chat no respondió a tiempo. Revisá la conexión y reintentá.');
          error.name = 'ChatTimeoutError';
          reject(error);
          controller?.abort();
        }, milliseconds);
      }),
    ]);
  } finally { if (timer) clearTimeout(timer); }
}

export function isRetryableChatError(reason: unknown): boolean {
  return ['ChatTimeoutError', 'ChatNetworkError', 'TypeError'].includes((reason as Error)?.name);
}

export function isChatAuthError(reason: unknown): boolean { return (reason as Error)?.name === 'ChatAuthError'; }
export function isChatConnectionError(reason: unknown): boolean { return isRetryableChatError(reason); }

/** Código/origen sirven para diagnóstico; nunca se refleja el texto crudo de Auth/PostgREST. */
export function chatFailure(reason: unknown, source: string, auth = false): Error {
  const failure = (reason || {}) as { code?: string; status?: number; name?: string; message?: string };
  const code = failure.code || '';
  let name = 'ChatOperationError';
  let message = 'El servidor rechazó la operación del chat. Actualizá la conversación y reintentá.';
  if (failure.name === 'ChatTimeoutError') return reason as Error;
  if (isRetryableChatError(reason) || failure.name === 'AuthRetryableFetchError' || failure.status === 0 || (failure.status || 0) >= 500 || /^08/.test(code) || /^PGRST00[0-3]$/.test(code) || (!code && /fetch|network|offline|connection|abort|internet/i.test(failure.message || ''))) {
    name = 'ChatNetworkError'; message = 'Sin conexión con el chat. Revisá tu conexión y reintentá.';
  } else if (auth || ['PGRST301', 'PGRST302', 'PGRST303'].includes(code) || failure.status === 401) {
    name = 'ChatAuthError'; message = 'Iniciá sesión nuevamente para usar el chat compartido.';
  } else if (['PGRST205', '42P01'].includes(code)) {
    name = 'ChatTableUnavailableError'; message = 'El chat compartido todavía no está habilitado: Supabase no encuentra una tabla de mensajería en su API. El responsable debe habilitarla.';
  } else if (['PGRST202', '42883'].includes(code)) {
    name = 'ChatRpcUnavailableError'; message = 'Falta habilitar una función de mensajería en Supabase. El responsable debe revisar el contrato del chat.';
  } else if (['PGRST200', 'PGRST201', 'PGRST203', 'PGRST204', '42703'].includes(code)) {
    name = 'ChatContractError'; message = 'La estructura del chat no coincide con el contrato de la aplicación. El responsable debe revisar relaciones, columnas y funciones.';
  } else if (code === '42501') {
    name = 'ChatPermissionError'; message = 'No tenés permiso para acceder a esta conversación. Si sos participante, el responsable debe revisar los permisos del chat.';
  }
  return Object.assign(new Error(message), { name, code, source });
}
