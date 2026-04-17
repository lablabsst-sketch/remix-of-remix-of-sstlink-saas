import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ShieldCheck, ShieldOff, Loader2 } from "lucide-react";

interface VerificadoToggleProps {
  workerId: string;
  verificado: boolean;
  verificadoEn?: string | null;
  editable?: boolean;
  onUpdate?: (id: string, verificado: boolean, verificadoEn: string | null) => void;
}

export function VerificadoToggle({
  workerId,
  verificado,
  verificadoEn,
  editable = true,
  onUpdate,
}: VerificadoToggleProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [localChecked, setLocalChecked] = useState(verificado);

  const handleToggle = async (next: boolean) => {
    if (!editable || loading) return;

    setLocalChecked(next);
    setLoading(true);

    const now = next ? new Date().toISOString() : null;

    const { error } = await supabase
      .from("trabajadores")
      .update({
        verificado_ingreso: next,
        verificado_en: now,
        verificado_por: next ? user?.id ?? null : null,
      } as any)
      .eq("id", workerId);

    if (error) {
      setLocalChecked(!next);
      toast({
        title: "No se pudo actualizar",
        description: error.message,
        variant: "destructive",
      });
    } else {
      onUpdate?.(workerId, next, now);
      toast({
        title: next ? "Trabajador verificado" : "Verificación retirada",
        description: next
          ? "Ahora aparecerá como autorizado para ingreso."
          : "El trabajador ya no está autorizado.",
      });
    }
    setLoading(false);
  };

  const tooltipText = localChecked
    ? verificadoEn
      ? `Verificado el ${new Date(verificadoEn).toLocaleDateString("es-CO", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}`
      : "Autorizado para ingreso"
    : "Sin verificar";

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex items-center gap-1.5">
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 text-muted-foreground animate-spin" />
            ) : localChecked ? (
              <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
            ) : (
              <ShieldOff className="w-3.5 h-3.5 text-muted-foreground/50" />
            )}
            <Checkbox
              checked={localChecked}
              onCheckedChange={(v) => handleToggle(!!v)}
              disabled={!editable || loading}
              aria-label="Verificar trabajador para ingreso"
              className="h-4 w-4"
            />
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-[11px]">
          {tooltipText}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
