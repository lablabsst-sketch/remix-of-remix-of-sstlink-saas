import { useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export type TipoAccion = "whatsapp" | "ai" | "export" | "capacitacion";

const DEBOUNCE_MS: Record<TipoAccion, number> = {
  whatsapp: 3000,
  ai: 2000,
  export: 5000,
  capacitacion: 1000,
};

export function useRateLimit() {
  const { empresa } = useAuth();
  const { toast } = useToast();
  const lastCall = useRef<Record<string, number>>({});

  const check = useCallback(
    async (tipo: TipoAccion, opciones?: { silencioso?: boolean }): Promise<boolean> => {
      if (!empresa?.id) return false;

      const ahora = Date.now();
      const ultimaVez = lastCall.current[tipo] ?? 0;
      const debounce = DEBOUNCE_MS[tipo];

      if (ahora - ultimaVez < debounce) {
        if (!opciones?.silencioso) {
          toast({
            title: "Demasiado rápido",
            description: `Espera ${Math.ceil((debounce - (ahora - ultimaVez)) / 1000)}s antes de intentar de nuevo.`,
            variant: "destructive",
          });
        }
        return false;
      }
      lastCall.current[tipo] = ahora;
      return true;
    },
    [empresa?.id, toast]
  );

  return { check };
}
