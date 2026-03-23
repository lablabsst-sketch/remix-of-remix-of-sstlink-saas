import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface Empresa {
  id: string;
  nombre: string;
  nit: string | null;
  nivel_proteccion: string | null;
  num_empleados_directos: number | null;
  sector_industria: string | null;
  tiene_contratistas: boolean | null;
}

interface Usuario {
  id: string;
  nombre: string;
  apellido: string | null;
  cargo: string | null;
  empresa_id: string | null;
}

interface AuthState {
  session: Session | null;
  user: User | null;
  usuario: Usuario | null;
  empresa: Empresa | null;
  loading: boolean;
}

const AuthContext = createContext<AuthState>({
  session: null,
  user: null,
  usuario: null,
  empresa: null,
  loading: true,
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    usuario: null,
    empresa: null,
    loading: true,
  });

  useEffect(() => {
    // Set up listener BEFORE getSession
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          setState(prev => ({ ...prev, session, user: session.user }));
          // Defer data fetch to avoid deadlocks
          setTimeout(() => fetchUserData(session.user.id), 0);
        } else {
          setState({ session: null, user: null, usuario: null, empresa: null, loading: false });
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setState(prev => ({ ...prev, session, user: session.user }));
        fetchUserData(session.user.id);
      } else {
        setState(prev => ({ ...prev, loading: false }));
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchUserData(userId: string) {
    try {
      const { data: usuario } = await supabase
        .from("usuarios")
        .select("id, nombre, apellido, cargo, empresa_id")
        .eq("user_id", userId)
        .maybeSingle();

      let empresa: Empresa | null = null;
      if (usuario?.empresa_id) {
        const { data } = await supabase
          .from("empresas")
          .select("id, nombre, nit, nivel_proteccion, num_empleados_directos, sector_industria, tiene_contratistas")
          .eq("id", usuario.empresa_id)
          .maybeSingle();
        empresa = data;
      }

      setState(prev => ({ ...prev, usuario, empresa, loading: false }));
    } catch {
      setState(prev => ({ ...prev, loading: false }));
    }
  }

  return (
    <AuthContext.Provider value={state}>
      {children}
    </AuthContext.Provider>
  );
}
