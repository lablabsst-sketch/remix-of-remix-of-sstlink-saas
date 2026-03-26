import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface WorkerData {
  id?: string;
  nombres: string;
  apellidos: string;
  tipo_documento: string;
  numero_documento: string;
  cargo: string;
  email: string;
  telefono: string;
  fecha_ingreso: Date | undefined;
  tipo_contrato: string;
}

interface AddWorkerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empresaId: string | null;
  onSuccess: (worker?: any) => void;
  editWorker?: WorkerData & { id: string } | null;
}

const emptyForm: WorkerData = {
  nombres: "",
  apellidos: "",
  tipo_documento: "",
  numero_documento: "",
  cargo: "",
  email: "",
  telefono: "",
  fecha_ingreso: undefined,
  tipo_contrato: "",
};

export function AddWorkerModal({ open, onOpenChange, empresaId, onSuccess, editWorker }: AddWorkerModalProps) {
  const { toast } = useToast();
  const { user: authUser, empresa } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<WorkerData>(emptyForm);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);

  const isEdit = !!editWorker?.id;

  useEffect(() => {
    if (open && editWorker) {
      setForm({
        nombres: editWorker.nombres,
        apellidos: editWorker.apellidos,
        tipo_documento: editWorker.tipo_documento,
        numero_documento: editWorker.numero_documento,
        cargo: editWorker.cargo || "",
        email: editWorker.email || "",
        telefono: editWorker.telefono || "",
        fecha_ingreso: editWorker.fecha_ingreso ? new Date(editWorker.fecha_ingreso + "T00:00:00") : undefined,
        tipo_contrato: editWorker.tipo_contrato || "",
      });
      setTouched({});
      setSubmitted(false);
    } else if (open && !editWorker) {
      setForm(emptyForm);
      setTouched({});
      setSubmitted(false);
    }
  }, [open, editWorker]);

  // Validation
  const errors: Record<string, string> = {};
  if (form.nombres.trim().length < 2) errors.nombres = "Mínimo 2 caracteres";
  if (form.apellidos.trim().length < 2) errors.apellidos = "Mínimo 2 caracteres";
  if (!form.tipo_documento) errors.tipo_documento = "Selecciona un tipo";
  if (form.numero_documento.trim().length < 6) errors.numero_documento = "Mínimo 6 caracteres";
  if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = "Email inválido";
  }

  const isValid = Object.keys(errors).length === 0;
  const showError = (field: string) => (touched[field] || submitted) && errors[field];
  const resolvedEmpresaId = empresaId ?? empresa?.id ?? null;

  const handleBlur = (field: string) => setTouched(p => ({ ...p, [field]: true }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!isValid) return;

    const empresa_id = resolvedEmpresaId;

    if (!empresa_id) {
      toast({ title: "No se encontró tu empresa. Recarga la página e intenta de nuevo.", variant: "destructive" });
      console.error("empresa_id is null — cannot save worker");
      return;
    }

    setLoading(true);

    try {
      console.log("=== SAVE WORKER DEBUG ===");
      console.log("1. Auth user:", authUser);
      console.log("2. empresa_id resolved:", empresa_id);
      console.log("3. Form data being sent:", form);
      console.log("4. Supabase client initialized:", !!supabase);

      // Check duplicate (skip if editing same doc)
      if (!isEdit || form.numero_documento.trim() !== editWorker?.numero_documento) {
        const { data: existing } = await supabase
          .from("trabajadores")
          .select("id")
          .eq("empresa_id", empresa_id)
          .eq("numero_documento", form.numero_documento.trim())
          .maybeSingle();

        if (existing) {
          toast({ title: "Ya existe un trabajador con ese número de documento.", variant: "destructive" });
          setLoading(false);
          return;
        }
      }

      const payload = {
        nombres: form.nombres.trim(),
        apellidos: form.apellidos.trim(),
        tipo_documento: form.tipo_documento,
        numero_documento: form.numero_documento.trim(),
        cargo: form.cargo.trim() || null,
        email: form.email.trim().toLowerCase() || null,
        telefono: form.telefono.trim() || null,
        fecha_ingreso: form.fecha_ingreso ? format(form.fecha_ingreso, "yyyy-MM-dd") : null,
        tipo_contrato: form.tipo_contrato || null,
      };

      if (isEdit) {
        const { data, error } = await supabase
          .from("trabajadores")
          .update(payload)
          .eq("id", editWorker!.id)
          .select()
          .single();

        console.log("5. Insert result - data:", data);
        console.log("6. Insert result - error:", error);
        console.log("7. Error details:", JSON.stringify(error, null, 2));

        if (error) {
          toast({ title: "Error al actualizar", description: error.message, variant: "destructive" });
        } else {
          toast({ title: "Datos actualizados correctamente." });
          onOpenChange(false);
          onSuccess(data);
        }
      } else {
        const { data, error } = await supabase
          .from("trabajadores")
          .insert({ ...payload, empresa_id, estado: "pendiente" })
          .select()
          .single();

        console.log("5. Insert result - data:", data);
        console.log("6. Insert result - error:", error);
        console.log("7. Error details:", JSON.stringify(error, null, 2));

        if (error) {
          toast({ title: "No se pudo guardar el trabajador. Intenta nuevamente.", description: error.message, variant: "destructive" });
          console.error("Insert error:", error);
        } else {
          toast({ title: `${form.nombres.trim()} ${form.apellidos.trim()} fue agregado correctamente.` });
          onOpenChange(false);
          setForm(emptyForm);
          onSuccess(data);
        }
      }
    } catch (err: any) {
      toast({ title: "Error inesperado", description: err?.message, variant: "destructive" });
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" aria-describedby="add-worker-desc">
        <DialogHeader>
          <DialogTitle className="text-base font-medium">
            {isEdit ? "Editar Trabajador" : "Añadir Trabajador"}
          </DialogTitle>
          <p id="add-worker-desc" className="text-xs text-muted-foreground">
            {isEdit ? "Modifica los datos del trabajador." : "Completa los datos del nuevo trabajador."}
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Nombres / Apellidos */}
          <div className="grid grid-cols-2 gap-3">
            <FieldWrap label="Nombres *" error={showError("nombres")}>
              <Input value={form.nombres} onChange={e => setForm(p => ({ ...p, nombres: e.target.value }))} onBlur={() => handleBlur("nombres")} className="h-8 text-xs" disabled={loading} />
            </FieldWrap>
            <FieldWrap label="Apellidos *" error={showError("apellidos")}>
              <Input value={form.apellidos} onChange={e => setForm(p => ({ ...p, apellidos: e.target.value }))} onBlur={() => handleBlur("apellidos")} className="h-8 text-xs" disabled={loading} />
            </FieldWrap>
          </div>

          {/* Tipo Doc / Num Doc */}
          <div className="grid grid-cols-2 gap-3">
            <FieldWrap label="Tipo Documento *" error={showError("tipo_documento")}>
              <Select value={form.tipo_documento} onValueChange={v => { setForm(p => ({ ...p, tipo_documento: v })); setTouched(p => ({ ...p, tipo_documento: true })); }} disabled={loading}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CC">CC - Cédula</SelectItem>
                  <SelectItem value="CE">CE - Cédula Extranjería</SelectItem>
                  <SelectItem value="TI">TI - Tarjeta Identidad</SelectItem>
                  <SelectItem value="PP">PP - Pasaporte</SelectItem>
                </SelectContent>
              </Select>
            </FieldWrap>
            <FieldWrap label="Número Documento *" error={showError("numero_documento")}>
              <Input value={form.numero_documento} onChange={e => setForm(p => ({ ...p, numero_documento: e.target.value.replace(/[^a-zA-Z0-9]/g, "") }))} onBlur={() => handleBlur("numero_documento")} className="h-8 text-xs" disabled={loading} />
            </FieldWrap>
          </div>

          {/* Cargo */}
          <FieldWrap label="Cargo (opcional)">
            <Input value={form.cargo} onChange={e => setForm(p => ({ ...p, cargo: e.target.value }))} placeholder="Ej: Operativo, Administrativo" className="h-8 text-xs" disabled={loading} />
          </FieldWrap>

          {/* Email / Teléfono */}
          <div className="grid grid-cols-2 gap-3">
            <FieldWrap label="Email (opcional)" error={showError("email")}>
              <Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} onBlur={() => handleBlur("email")} placeholder="correo@email.com" className="h-8 text-xs" disabled={loading} />
            </FieldWrap>
            <FieldWrap label="Teléfono (opcional)">
              <Input value={form.telefono} onChange={e => setForm(p => ({ ...p, telefono: e.target.value }))} placeholder="3001234567" className="h-8 text-xs" disabled={loading} />
            </FieldWrap>
          </div>

          {/* Fecha ingreso / Tipo contrato */}
          <div className="grid grid-cols-2 gap-3">
            <FieldWrap label="Fecha de ingreso (opcional)">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("h-8 text-xs w-full justify-start font-normal", !form.fecha_ingreso && "text-muted-foreground")} disabled={loading}>
                    <CalendarIcon className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
                    {form.fecha_ingreso ? format(form.fecha_ingreso, "dd MMM yyyy", { locale: es }) : "Seleccionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={form.fecha_ingreso} onSelect={d => setForm(p => ({ ...p, fecha_ingreso: d }))} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </FieldWrap>
            <FieldWrap label="Tipo de contrato (opcional)">
              <Select value={form.tipo_contrato} onValueChange={v => setForm(p => ({ ...p, tipo_contrato: v }))} disabled={loading}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="indefinido">Indefinido</SelectItem>
                  <SelectItem value="fijo">Fijo</SelectItem>
                  <SelectItem value="obra">Obra o labor</SelectItem>
                  <SelectItem value="aprendiz">Aprendiz</SelectItem>
                  <SelectItem value="prestacion">Prestación de servicios</SelectItem>
                </SelectContent>
              </Select>
            </FieldWrap>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="text-xs h-8" disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || (!isValid && submitted)} className={cn("text-xs h-8", !isValid && submitted && "opacity-50 cursor-not-allowed")}>
              {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> Guardando...</> : isEdit ? "Actualizar" : "Guardar Trabajador"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FieldWrap({ label, error, children }: { label: string; error?: string | false; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-[11px] text-muted-foreground">{label}</Label>
      {children}
      {error && <p className="text-[10px] text-destructive">{error}</p>}
    </div>
  );
}
