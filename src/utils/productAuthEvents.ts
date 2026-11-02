import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

/** Una sesión inicial o un token renovado no cambian el dueño de las publicaciones. */
export function createProductUserChangeListener(onChange: () => void) {
  let previousUserId: string | null | undefined;
  return (event: AuthChangeEvent, session: Session | null) => {
    const nextUserId = session?.user.id ?? null;
    // Supabase puede recuperar la sesión con SIGNED_IN antes de INITIAL_SESSION.
    // La primera carga ya consulta al usuario; este primer evento solo fija su identidad.
    if (previousUserId === undefined) {
      previousUserId = nextUserId;
      if (event === 'SIGNED_OUT') onChange();
      return;
    }
    if (nextUserId !== previousUserId) {
      previousUserId = nextUserId;
      onChange();
    }
  };
}
