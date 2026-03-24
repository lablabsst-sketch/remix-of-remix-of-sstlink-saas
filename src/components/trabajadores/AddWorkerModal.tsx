import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface AddWorkerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empresaId: string | null;
  onSuccess: () => void;
}

export function AddWorkerModal({ open, onOpenChange, empresaId, onSuccess }: AddWorkerModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nombres: "",
    apellidos: "",
    tipo_documento: "CC",
    numero_documento: "",
    cargo: "",
    email: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.nombres.trim()) errs.nombres = "Requerido";
    if (!form.apellidos.trim()) errs.apellidos = "Requerido";
    if (!form.numero_documento.trim()) errs.numero_documento = "Requerido";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !empresaId) return;

    setLoading(true);
    const { error } = await supabase.from("trabajadores").insert({
      empresa_id: empresaId,
      nombres: form.nombres.trim(),
      apellidos: form.apellidos.trim(),
      tipo_documento: form.tipo_documento,
      numero_documento: form.numero_documento.trim(),
      cargo: form.cargo.trim() || null,
      email: form.email.trim() || null,
    });

    if (error) {
      toast({ title: "Error al crear trabajador", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Trabajador agregado exitosamente" });
      setForm({ nombres: "", apellidos: "", tipo_documento: "CC", numero_documento: "", cargo: "", email: "" });
      setErrors({});
      onOpenChange(false);
      onSuccess();
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-medium">Añadir Trabajador</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Nombres *</Label>
              <Input
                value={form.nombres}
                onChange={(e) => setForm((p) => ({ ...p, nombres: e.target.value }))}
                className="h-8 text-xs"
              />
              {errors.nombres && <p className="text-[10px] text-destructive">{errors.nombres}</p>}
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Apellidos *</Label>
              <Input
                value={form.apellidos}
                onChange={(e) => setForm((p) => ({ ...p, apellidos: e.target.value }))}
                className="h-8 text-xs"
              />
              {errors.apellidos && <p className="text-[10px] text-destructive">{errors.apellidos}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Tipo Documento</Label>
              <Select value={form.tipo_documento} onValueChange={(v) => setForm((p) => ({ ...p, tipo_documento: v }))}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CC">CC - Cédula</SelectItem>
                  <SelectItem value="CE">CE - Cédula Extranjería</SelectItem>
                  <SelectItem value="TI">TI - Tarjeta Identidad</SelectItem>
                  <SelectItem value="PA">PA - Pasaporte</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Número Documento *</Label>
              <Input
                value={form.numero_documento}
                onChange={(e) => setForm((p) => ({ ...p, numero_documento: e.target.value }))}
                className="h-8 text-xs"
              />
              {errors.numero_documento && <p className="text-[10px] text-destructive">{errors.numero_documento}</p>}
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Cargo</Label>
            <Input
              value={form.cargo}
              onChange={(e) => setForm((p) => ({ ...p, cargo: e.target.value }))}
              placeholder="Ej: Operativo, Administrativo"
              className="h-8 text-xs"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Email (opcional)</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              placeholder="trabajador@email.com"
              className="h-8 text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="text-xs h-8">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="text-xs h-8">
              {loading ? "Guardando..." : "Guardar Trabajador"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
