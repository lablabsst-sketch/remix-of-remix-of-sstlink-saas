import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const ESTADOS = [
  { value: "aprobado", label: "Aprobado", bg: "bg-[#F0FDF4]", text: "text-[#16A34A]", border: "border-[#BBF7D0]" },
  { value: "pendiente", label: "Pendiente", bg: "bg-[#FFF3EE]", text: "text-[#FF6B2C]", border: "border-[#FFD5BC]" },
  { value: "inactivo", label: "Inactivo", bg: "bg-[#F9FAFB]", text: "text-[#6B7280]", border: "border-[#E5E7EB]" },
];

interface EstadoChipProps {
  workerId: string;
  estado: string;
  editable: boolean;
  onUpdate: (id: string, newEstado: string) => void;
}

export function EstadoChip({ workerId, estado, editable, onUpdate }: EstadoChipProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const style = ESTADOS.find(e => e.value === estado) || ESTADOS[2];

  const handleChange = async (newEstado: string) => {
    if (newEstado === estado) { setOpen(false); return; }
    setUpdating(true);
    const { error } = await supabase.from("trabajadores").update({ estado: newEstado }).eq("id", workerId);
    if (error) {
      toast({ title: "Error al cambiar estado", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Estado cambiado a ${newEstado}.` });
      onUpdate(workerId, newEstado);
    }
    setUpdating(false);
    setOpen(false);
  };

  const chip = (
    <Badge className={cn("text-[10px] px-2 py-0.5 font-medium border-[0.5px]", style.bg, style.text, style.border, editable && "cursor-pointer")}>
      {style.label}
    </Badge>
  );

  if (!editable) return chip;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{chip}</PopoverTrigger>
      <PopoverContent className="w-36 p-1" align="start">
        {ESTADOS.map(e => (
          <button
            key={e.value}
            onClick={() => handleChange(e.value)}
            disabled={updating}
            className={cn("w-full text-left text-xs px-2 py-1.5 rounded hover:bg-accent transition-colors", e.value === estado && "font-semibold")}
          >
            <span className={cn("inline-block w-2 h-2 rounded-full mr-2", e.value === "aprobado" ? "bg-[#16A34A]" : e.value === "pendiente" ? "bg-[#FF6B2C]" : "bg-[#6B7280]")} />
            {e.label}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
