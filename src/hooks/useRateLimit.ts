import { useCallback, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export type TipoAccion = "whatsapp" | "ai" | "export" | "capacitacion";

interface RateLimitResult {
  allowed: boolean;
  plan?: string;
  razon?: "hora" | "dia" | "mes";
  limite?: number;
  reinicia_en?: string;
  uso_hora?: number;
  uso_dia?: number;
  uso_mes?: number;
  limite_hora?: number;
  limite_dia?: number;
  limite_mes?: number;
}

const DEBOUNCE_MS: Record<TipoAccion, number> = {
  whatsapp:     3000,
  ai:           2000,
  export:       5000,
  capacitacion: 1000,
};

export function useRateLimit() {
  const { empresa } = useAuth();
  const { toast } = useToast();
  const lastCall = useRef<Record<string, number>>({});
  const [usageInfo, setUsageInfo] = useState<RateLimitResult | null>(null);

  const check = useCallback(async (
    tipo: TipoAccion,
    opciones?: { silencioso?: boolean }
  ): Promise<boolean> => {
    if (!empresa?.id) return false;

    // CAPA 1 — Debounce frontend
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

    // CAPA 2 + 3 — Plan + Supabase
    const { data, error } = await supabase.rpc("check_rate_limit", {
      p_empresa_id: empresa.id,
      p_tipo: tipo,
    });

    if (error) {
      console.error("Rate limit error:", error);
      return true; // fail-open
    }

    const result = data as RateLimitResult;
    setUsageInfo(result);

    if (!result.allowed) {
      const reinicia = result.reinicia_en
        ? formatDistanceToNow(new Date(result.reinicia_en), { locale: es, addSuffix: true })
        : "pronto";

      const mensajes = {
        hora: `Límite por hora alcanzado (${result.limite}). Reinicia ${reinicia}.`,
        dia:  `Límite diario alcanzado (${result.limite}). Reinicia ${reinicia}.`,
        mes:  `Límite mensual alcanzado (${result.limite}). Considera actualizar tu plan.`,
      };

      if (!opciones?.silencioso) {
        toast({
          title: "Límite alcanzado",
          description: mensajes[result.razon!] ?? "Intenta más tarde.",
          variant: "destructive",
        });

        if (result.razon === "mes" && result.plan !== "enterprise") {
          setTimeout(() => toast({
            title: "¿Necesitas más capacidad?",
            description: `Plan actual: ${result.plan}. Actualiza para continuar.`,
          }), 1200);
        }
      }
      return false;
    }

    // Alerta al 80% del límite diario
    if (result.uso_dia && result.limite_dia && result.limite_dia > 0) {
      const pct = result.uso_dia / result.limite_dia;
      if (pct >= 0.8 && !opciones?.silencioso) {
        toast({
          title: "⚠️ Acercándote al límite diario",
          description: `${result.uso_dia}/${result.limite_dia} llamadas usadas hoy.`,
        });
      }
    }

    return true;
  }, [empresa?.id]);

  return { check, usageInfo };
}
