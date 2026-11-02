import { supabase } from '../supabase';
import { getAuthCallbackError } from '../utils/auth';

/** El cliente procesa la URL durante su inicialización; no intercambiar el código dos veces. */
export async function completeWebAuthCallback(url: string) {
  const callbackError = getAuthCallbackError(url);
  if (callbackError) throw new Error(callbackError);
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  if (!session) {
    throw new Error('No se recibió una sesión válida. Volvé a iniciar sesión desde este mismo dominio y puerto. El responsable de Supabase debe revisar las Redirect URLs si el retorno cambia de origen.');
  }
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error('No se pudo validar la sesión recibida. Volvé a iniciar sesión.');
  return session;
}
