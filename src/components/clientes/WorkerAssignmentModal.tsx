import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  clienteId: string;
  clienteNombre: string;
  onSaved: () => void;
}

interface Worker {
  id: string;
  nombres: string;
  apellidos: string;
  cargo: string | null;
  numero_documento: string;
}

export function WorkerAssignmentModal({ open, onClose, clienteId, clienteNombre, onSaved }: Props) {
  const { empresa } = useAuth();
  const { toast } = useToast();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [assigned, setAssigned] = useState<Set<string>>(new Set());
  const [original, setOriginal] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !empresa?.id) return;
    setLoading(true);

    Promise.all([
      supabase.from("trabajadores").select("id, nombres, apellidos, cargo, numero_documento")
        .eq("empresa_id", empresa.id).eq("eliminado", false).order("nombres"),
      supabase.from("trabajadores_cliente").select("trabajador_id")
        .eq("cliente_id", clienteId).eq("activo", true),
    ]).then(([wRes, aRes]) => {
      setWorkers(wRes.data ?? []);
      const ids = new Set((aRes.data ?? []).map(r => r.trabajador_id));
      setAssigned(ids);
      setOriginal(new Set(ids));
      setLoading(false);
    });
  }, [open, empresa?.id, clienteId]);

  const toggle = (id: string) => {
    setAssigned(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    if (!empresa?.id) return;
    setSaving(true);

    const toAdd = [...assigned].filter(id => !original.has(id));
    const toRemove = [...original].filter(id => !assigned.has(id));

    if (toAdd.length > 0) {
      await supabase.from("trabajadores_cliente").upsert(
        toAdd.map(trabajador_id => ({ empresa_id: empresa.id, cliente_id: clienteId, trabajador_id, activo: true })),
        { onConflict: "cliente_id,trabajador_id" }
      );
    }
    if (toRemove.length > 0) {
      await supabase.from("trabajadores_cliente").delete()
        .eq("cliente_id", clienteId).in("trabajador_id", toRemove);
    }
    setSaving(false);
    toast({ title: "Trabajadores actualizados" });
    onSaved();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Asignar trabajadores — {clienteNombre}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin w-6 h-6 text-muted-foreground" /></div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            {workers.length === 0 && <p className="text-muted-foreground text-sm py-4 text-center">No hay trabajadores registrados.</p>}
            {workers.map(w => (
              <label key={w.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer">
                <Checkbox checked={assigned.has(w.id)} onCheckedChange={() => toggle(w.id)} />
                <div className="text-sm">
                  <span className="font-medium">{w.nombres} {w.apellidos}</span>
                  {w.cargo && <span className="text-muted-foreground ml-2">— {w.cargo}</span>}
                  <span className="text-muted-foreground ml-2 text-xs">({w.numero_documento})</span>
                </div>
              </label>
            ))}
          </div>
        )}

        <div className="flex justify-between items-center pt-3 border-t">
          <span className="text-xs text-muted-foreground">{assigned.size} seleccionados</span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Guardando…" : "Guardar"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
