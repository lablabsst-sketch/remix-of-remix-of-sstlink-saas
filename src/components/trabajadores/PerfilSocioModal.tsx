import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export interface PerfilSocio {
  // Personal / social
  estado_civil: string;
  nivel_escolaridad: string;
  estrato_socioeconomico: string;
  personas_a_cargo: string;
  tipo_vivienda: string;
  // Laboral
  area_trabajo: string;
  jornada_trabajo: string;
  rango_salarial: string;
  // Salud y hábitos
  antecedentes_salud: string;
  estado_vacunacion: string;
  actividad_fisica: string;
  consumo_tabaco: string;
  consumo_alcohol: string;
}

const blank: PerfilSocio = {
  estado_civil: "", nivel_escolaridad: "", estrato_socioeconomico: "",
  personas_a_cargo: "", tipo_vivienda: "",
  area_trabajo: "", jornada_trabajo: "", rango_salarial: "",
  antecedentes_salud: "", estado_vacunacion: "",
  actividad_fisica: "", consumo_tabaco: "", consumo_alcohol: "",
};

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  trabajadorId: string;
  initial?: Partial<PerfilSocio>;
  onSuccess: (updated: PerfilSocio) => void;
}

function Sel({
  label, id, value, onChange, options,
}: {
  label: string; id: string; value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <Label htmlFor={id} className="text-xs mb-1 block">{label}</Label>
      <Select value={value || ""} onValueChange={onChange}>
        <SelectTrigger id={id} className="h-8 text-xs">
          <SelectValue placeholder="Seleccionar…" />
        </SelectTrigger>
        <SelectContent>
          {options.map(o => <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

export function PerfilSocioModal({ open, onOpenChange, trabajadorId, initial, onSuccess }: Props) {
  const { toast } = useToast();
  const [form, setForm] = useState<PerfilSocio>({ ...blank, ...initial });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm({ ...blank, ...initial });
  }, [open, initial]);

  const set = (key: keyof PerfilSocio) => (v: string) => setForm(p => ({ ...p, [key]: v }));

  const handleSave = async () => {
    setSaving(true);
    const { error } = await (supabase as any)
      .from("trabajadores")
      .update({ perfil_sociodemografico: form })
      .eq("id", trabajadorId);
    setSaving(false);
    if (error) {
      toast({ title: "Error al guardar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Perfil actualizado" });
      onSuccess(form);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Datos complementarios — Perfil Sociodemográfico</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-1">

          {/* ── 1. Variables personales ── */}
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Variables sociodemográficas
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Sel label="Estado civil" id="estado_civil" value={form.estado_civil} onChange={set("estado_civil")} options={[
                { value: "soltero", label: "Soltero/a" },
                { value: "casado", label: "Casado/a" },
                { value: "union_libre", label: "Unión libre" },
                { value: "separado", label: "Separado/a" },
                { value: "divorciado", label: "Divorciado/a" },
                { value: "viudo", label: "Viudo/a" },
              ]} />
              <Sel label="Nivel de escolaridad" id="nivel_escolaridad" value={form.nivel_escolaridad} onChange={set("nivel_escolaridad")} options={[
                { value: "ninguno", label: "Ninguno" },
                { value: "primaria", label: "Primaria" },
                { value: "bachillerato", label: "Bachillerato" },
                { value: "tecnico", label: "Técnico" },
                { value: "tecnologo", label: "Tecnólogo" },
                { value: "profesional", label: "Profesional" },
                { value: "especializacion", label: "Especialización" },
                { value: "maestria", label: "Maestría" },
                { value: "doctorado", label: "Doctorado" },
              ]} />
              <Sel label="Estrato socioeconómico" id="estrato" value={form.estrato_socioeconomico} onChange={set("estrato_socioeconomico")} options={[
                { value: "1", label: "Estrato 1" },
                { value: "2", label: "Estrato 2" },
                { value: "3", label: "Estrato 3" },
                { value: "4", label: "Estrato 4" },
                { value: "5", label: "Estrato 5" },
                { value: "6", label: "Estrato 6" },
              ]} />
              <Sel label="Personas a cargo" id="personas_cargo" value={form.personas_a_cargo} onChange={set("personas_a_cargo")} options={[
                { value: "0", label: "0 — Sin personas a cargo" },
                { value: "1", label: "1 persona" },
                { value: "2", label: "2 personas" },
                { value: "3", label: "3 personas" },
                { value: "4", label: "4 personas" },
                { value: "5+", label: "5 o más personas" },
              ]} />
              <Sel label="Tipo de vivienda" id="tipo_vivienda" value={form.tipo_vivienda} onChange={set("tipo_vivienda")} options={[
                { value: "propia", label: "Propia" },
                { value: "arrendada", label: "Arrendada" },
                { value: "familiar", label: "Familiar / sin costo" },
              ]} />
            </div>
          </div>

          {/* ── 2. Variables laborales ── */}
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Variables laborales
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="area_trabajo" className="text-xs mb-1 block">Área / departamento</Label>
                <Input
                  id="area_trabajo"
                  value={form.area_trabajo}
                  onChange={e => setForm(p => ({ ...p, area_trabajo: e.target.value }))}
                  placeholder="ej: Producción, Administrativo…"
                  className="h-8 text-xs"
                />
              </div>
              <Sel label="Jornada / turno" id="jornada" value={form.jornada_trabajo} onChange={set("jornada_trabajo")} options={[
                { value: "diurno", label: "Diurno" },
                { value: "nocturno", label: "Nocturno" },
                { value: "mixto", label: "Mixto" },
                { value: "rotativo", label: "Rotativo" },
              ]} />
              <Sel label="Rango salarial" id="rango_salarial" value={form.rango_salarial} onChange={set("rango_salarial")} options={[
                { value: "1_smlv", label: "1 SMLV" },
                { value: "1_2_smlv", label: "Entre 1 y 2 SMLV" },
                { value: "2_3_smlv", label: "Entre 2 y 3 SMLV" },
                { value: "3_5_smlv", label: "Entre 3 y 5 SMLV" },
                { value: "+5_smlv", label: "Más de 5 SMLV" },
              ]} />
            </div>
          </div>

          {/* ── 3. Salud y hábitos ── */}
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Salud y hábitos
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Sel label="Estado de vacunación" id="vacunacion" value={form.estado_vacunacion} onChange={set("estado_vacunacion")} options={[
                { value: "completo", label: "Esquema completo" },
                { value: "incompleto", label: "Incompleto" },
                { value: "sin_informacion", label: "Sin información" },
              ]} />
              <Sel label="Actividad física" id="actividad" value={form.actividad_fisica} onChange={set("actividad_fisica")} options={[
                { value: "nunca", label: "Nunca" },
                { value: "ocasional", label: "Ocasional" },
                { value: "2_3_semana", label: "2-3 veces/semana" },
                { value: "diario", label: "Diario" },
              ]} />
              <Sel label="Consumo de tabaco" id="tabaco" value={form.consumo_tabaco} onChange={set("consumo_tabaco")} options={[
                { value: "no", label: "No consume" },
                { value: "ex_fumador", label: "Ex fumador/a" },
                { value: "si", label: "Sí consume" },
              ]} />
              <Sel label="Consumo de alcohol" id="alcohol" value={form.consumo_alcohol} onChange={set("consumo_alcohol")} options={[
                { value: "no", label: "No consume" },
                { value: "ocasional", label: "Ocasional" },
                { value: "frecuente", label: "Frecuente" },
              ]} />
            </div>

            <div className="mt-3">
              <Label htmlFor="antecedentes" className="text-xs mb-1 block">Antecedentes de salud relevantes</Label>
              <Textarea
                id="antecedentes"
                value={form.antecedentes_salud}
                onChange={e => setForm(p => ({ ...p, antecedentes_salud: e.target.value }))}
                placeholder="Enfermedades crónicas, alergias, condiciones relevantes para el puesto…"
                className="text-xs min-h-[70px] resize-none"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />Guardando…</> : "Guardar perfil"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
