import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface ClienteData {
  id?: string;
  nombre: string;
  nit_cedula: string;
  tipo: string;
  contacto: string;
  email: string;
  telefono: string;
  notas: string;
}

const empty: ClienteData = { nombre: "", nit_cedula: "", tipo: "empresa", contacto: "", email: "", telefono: "", notas: "" };

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  editData?: ClienteData | null;
}

export function AddClienteModal({ open, onClose, onSaved, editData }: Props) {
  const { empresa } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState<ClienteData>(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(editData ?? empty);
  }, [editData, open]);

  const handleSave = async () => {
    if (!empresa?.id) return;
    if (!form.nombre.trim() || !form.nit_cedula.trim()) {
      toast({ title: "Campos requeridos", description: "Nombre y NIT/Cédula son obligatorios.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      empresa_id: empresa.id,
      nombre: form.nombre.trim(),
      nit_cedula: form.nit_cedula.trim(),
      tipo: form.tipo,
      contacto: form.contacto.trim() || null,
      email: form.email.trim() || null,
      telefono: form.telefono.trim() || null,
      notas: form.notas.trim() || null,
    };

    let error;
    if (editData?.id) {
      ({ error } = await supabase.from("clientes_portal").update(payload).eq("id", editData.id));
    } else {
      ({ error } = await supabase.from("clientes_portal").insert(payload));
    }
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: editData?.id ? "Cliente actualizado" : "Cliente creado" });
    onSaved();
    onClose();
  };

  const set = (k: keyof ClienteData, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editData?.id ? "Editar Cliente" : "Agregar Cliente"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Nombre *</Label>
            <Input value={form.nombre} onChange={e => set("nombre", e.target.value)} maxLength={200} />
          </div>
          <div>
            <Label>NIT / Cédula *</Label>
            <Input value={form.nit_cedula} onChange={e => set("nit_cedula", e.target.value)} maxLength={50} />
          </div>
          <div>
            <Label>Tipo</Label>
            <Select value={form.tipo} onValueChange={v => set("tipo", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="empresa">Empresa</SelectItem>
                <SelectItem value="persona">Persona</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Contacto</Label>
            <Input value={form.contacto} onChange={e => set("contacto", e.target.value)} maxLength={200} />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={e => set("email", e.target.value)} maxLength={255} />
          </div>
          <div>
            <Label>Teléfono</Label>
            <Input value={form.telefono} onChange={e => set("telefono", e.target.value)} maxLength={30} />
          </div>
          <div>
            <Label>Notas</Label>
            <Textarea value={form.notas} onChange={e => set("notas", e.target.value)} maxLength={1000} rows={3} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Guardando…" : "Guardar"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
