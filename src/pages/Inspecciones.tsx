import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  ClipboardCheck, Plus, Pencil, Trash2, Printer, Camera, X,
  CheckCircle2, AlertCircle, Clock, ChevronRight,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Inspeccion {
  id: string;
  empresa_id: string;
  tipo: string;
  codigo: string;
  fecha: string;
  estado: string;
  responsable: string | null;
  observaciones_generales: string | null;
}

interface InspeccionElemento {
  id: string;
  inspeccion_id: string;
  empresa_id: string;
  numero: number;
  identificador: string;
  subtipo: string | null;
  checklist: Record<string, string>;
  campos_libres: { label: string; valor: string }[];
  observaciones: string | null;
  foto_urls: string[];
}

interface AccionCorrectiva {
  id: string;
  inspeccion_id: string;
  descripcion: string;
  responsable: string | null;
  fecha_limite: string | null;
  estado: string;
  tarea_id: string | null;
}

interface Usuario {
  id: string;
  nombre_completo: string;
  rol: string;
}

// ─── Checklist Definitions ────────────────────────────────────────────────────

type FieldType = "rating" | "text" | "date" | "select";

interface ChecklistField {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
  subtipos?: string[];
}

const CHECKLIST_DEFS: Record<string, ChecklistField[]> = {
  extintores: [
    { key: "capacidad", label: "Capacidad", type: "text" },
    { key: "tipo_agente", label: "Agente extintor", type: "select", options: ["A - Agua", "BC - CO₂", "ABC - Polvo Químico Seco", "ABC - Solkafalm"] },
    { key: "ubicacion", label: "Ubicación", type: "text" },
    { key: "fecha_ultima_recarga", label: "Últ. recarga", type: "date" },
    { key: "fecha_proxima_recarga", label: "Próx. recarga", type: "date" },
    { key: "estado_general", label: "Estado general", type: "rating" },
    { key: "senalizacion", label: "Señalización", type: "rating" },
    { key: "acceso", label: "Acceso", type: "rating" },
    { key: "instructivo", label: "Instructivo", type: "rating" },
    { key: "manometro", label: "Manómetro", type: "rating" },
    { key: "presion", label: "Presión manómetro", type: "text" },
    { key: "pasador", label: "Pasador/Seguro", type: "rating" },
    { key: "manguera", label: "Manguera", type: "rating" },
    { key: "boquilla", label: "Boquilla", type: "rating" },
    { key: "cuerpo", label: "Cuerpo", type: "rating" },
    { key: "maneta_fija", label: "Maneta fija", type: "rating" },
    { key: "palanca", label: "Palanca de accionamiento", type: "rating" },
    { key: "puerta_gabinete", label: "Puerta gabinete", type: "rating", subtipos: ["armario"] },
    { key: "vidrio_acrilico", label: "Vidrio/Acrílico", type: "rating", subtipos: ["armario"] },
    { key: "cerradura", label: "Cerradura", type: "rating", subtipos: ["armario"] },
    { key: "accesorios", label: "Accesorios (hacha, pica)", type: "rating", subtipos: ["armario"] },
  ],
  botiquines: [
    { key: "ubicacion", label: "Ubicación", type: "text" },
    { key: "antiseptico", label: "Antiséptico/Yodo", type: "rating" },
    { key: "gasa_esteril", label: "Gasa estéril", type: "rating" },
    { key: "vendas_elasticas", label: "Vendas elásticas", type: "rating" },
    { key: "esparadrapo", label: "Esparadrapo", type: "rating" },
    { key: "guantes_latex", label: "Guantes látex", type: "rating" },
    { key: "tijeras", label: "Tijeras", type: "rating" },
    { key: "suero_fisiologico", label: "Suero fisiológico", type: "rating" },
    { key: "manual_primeros_auxilios", label: "Manual primeros auxilios", type: "rating" },
    { key: "pinzas", label: "Pinzas", type: "rating", subtipos: ["b", "c"] },
    { key: "linterna", label: "Linterna", type: "rating", subtipos: ["b", "c"] },
    { key: "termometro", label: "Termómetro", type: "rating", subtipos: ["b", "c"] },
    { key: "vendas_triangulares", label: "Vendas triangulares", type: "rating", subtipos: ["b", "c"] },
    { key: "collarin", label: "Collarín cervical", type: "rating", subtipos: ["b", "c"] },
    { key: "tablillas", label: "Tablillas", type: "rating", subtipos: ["b", "c"] },
    { key: "bolsa_resucitacion", label: "Bolsa resucitación", type: "rating", subtipos: ["c"] },
    { key: "oximetro", label: "Oxímetro", type: "rating", subtipos: ["c"] },
    { key: "tensiometro", label: "Tensiómetro", type: "rating", subtipos: ["c"] },
    { key: "camilla", label: "Camilla", type: "rating", subtipos: ["c"] },
  ],
  equipos: [
    { key: "serial", label: "Serial/Modelo", type: "text" },
    { key: "ubicacion", label: "Ubicación", type: "text" },
    { key: "estado_fisico", label: "Estado físico", type: "rating" },
    { key: "funcionamiento", label: "Funcionamiento", type: "rating" },
    { key: "mantenimiento", label: "Mantenimiento al día", type: "rating" },
    { key: "calibracion", label: "Calibración vigente", type: "rating" },
    { key: "epp_requerido", label: "EPP requerido", type: "rating" },
    { key: "manual_disponible", label: "Manual disponible", type: "rating" },
    { key: "senalizacion", label: "Señalización", type: "rating" },
  ],
  instalaciones: [
    { key: "area", label: "Área/Zona", type: "text" },
    { key: "orden_aseo", label: "Orden y aseo", type: "rating" },
    { key: "iluminacion", label: "Iluminación", type: "rating" },
    { key: "ventilacion", label: "Ventilación", type: "rating" },
    { key: "senalizacion", label: "Señalización", type: "rating" },
    { key: "salidas_emergencia", label: "Salidas de emergencia", type: "rating" },
    { key: "rutas_evacuacion", label: "Rutas de evacuación", type: "rating" },
    { key: "equipos_emergencia", label: "Equipos de emergencia", type: "rating" },
    { key: "pisos_escaleras", label: "Pisos y escaleras", type: "rating" },
    { key: "inst_electricas", label: "Inst. eléctricas", type: "rating" },
    { key: "almacenamiento", label: "Almacenamiento", type: "rating" },
  ],
  vehiculos: [
    { key: "placa", label: "Placa", type: "text" },
    { key: "tipo_vehiculo", label: "Tipo de vehículo", type: "text" },
    { key: "soat", label: "SOAT vigente", type: "rating" },
    { key: "rtm", label: "RTM vigente", type: "rating" },
    { key: "extintor", label: "Extintor", type: "rating" },
    { key: "botiquin", label: "Botiquín", type: "rating" },
    { key: "kit_carretera", label: "Kit de carretera", type: "rating" },
    { key: "llantas", label: "Llantas", type: "rating" },
    { key: "frenos", label: "Frenos", type: "rating" },
    { key: "luces", label: "Luces", type: "rating" },
    { key: "espejos", label: "Espejos", type: "rating" },
    { key: "cinturones", label: "Cinturones", type: "rating" },
    { key: "documentos", label: "Documentos", type: "rating" },
  ],
  puestos_trabajo: [
    { key: "area", label: "Área/Puesto", type: "text" },
    { key: "trabajador", label: "Trabajador", type: "text" },
    { key: "silla_ergonomica", label: "Silla ergonómica", type: "rating" },
    { key: "altura_monitor", label: "Altura monitor", type: "rating" },
    { key: "iluminacion", label: "Iluminación", type: "rating" },
    { key: "ruido", label: "Ruido", type: "rating" },
    { key: "temperatura", label: "Temperatura", type: "rating" },
    { key: "orden_limpieza", label: "Orden y limpieza", type: "rating" },
    { key: "epp_disponible", label: "EPP disponible", type: "rating" },
    { key: "senalizacion", label: "Señalización", type: "rating" },
  ],
};

// ─── Constants ────────────────────────────────────────────────────────────────

const TIPO_CONFIG: Record<string, {
  label: string;
  shortCode: string;
  color: string;
  subtipos?: { value: string; label: string }[];
}> = {
  extintores: {
    label: "Extintores",
    shortCode: "EXT",
    color: "bg-red-100 text-red-700",
    subtipos: [
      { value: "armario", label: "Armario con señalización" },
      { value: "soporte", label: "Soporte con señalización" },
    ],
  },
  botiquines: {
    label: "Botiquines",
    shortCode: "BOT",
    color: "bg-green-100 text-green-700",
    subtipos: [
      { value: "a", label: "Tipo A" },
      { value: "b", label: "Tipo B" },
      { value: "c", label: "Tipo C" },
    ],
  },
  equipos: { label: "Equipos y Herramientas", shortCode: "EQU", color: "bg-blue-100 text-blue-700" },
  instalaciones: { label: "Instalaciones", shortCode: "INS", color: "bg-purple-100 text-purple-700" },
  vehiculos: { label: "Vehículos", shortCode: "VEH", color: "bg-orange-100 text-orange-700" },
  puestos_trabajo: { label: "Puestos de Trabajo", shortCode: "PUT", color: "bg-yellow-100 text-yellow-700" },
};

const ESTADO_COLOR: Record<string, string> = {
  pendiente: "bg-gray-100 text-gray-600",
  "en-proceso": "bg-blue-100 text-blue-700",
  completado: "bg-green-100 text-green-700",
  cancelado: "bg-red-100 text-red-700",
};

const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(nombre: string): string {
  return nombre.split(/\s+/).filter(Boolean).slice(0, 4).map(w => w[0]).join("").toUpperCase();
}

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function blankElemento() {
  return {
    identificador: "",
    subtipo: "",
    checklist: {} as Record<string, string>,
    campos_libres: [{ label: "", valor: "" }] as { label: string; valor: string }[],
    observaciones: "",
    foto_urls: [] as string[],
  };
}

function blankAccion() {
  return { descripcion: "", responsable: "", fecha_limite: "", estado: "pendiente" };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function InspeccionesPage() {
  const { empresa } = useAuth();
  const { toast } = useToast();

  const [inspecciones, setInspecciones] = useState<Inspeccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [empresaLogo, setEmpresaLogo] = useState<string | null>(null);
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");

  // Detail
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [inspeccionActual, setInspeccionActual] = useState<Inspeccion | null>(null);
  const [elementos, setElementos] = useState<InspeccionElemento[]>([]);
  const [acciones, setAcciones] = useState<AccionCorrectiva[]>([]);
  const [loadingDetalle, setLoadingDetalle] = useState(false);

  // Nueva inspección
  const [nuevaOpen, setNuevaOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formInsp, setFormInsp] = useState({
    tipo: "extintores", fecha: todayStr(), estado: "pendiente", responsable: "", observaciones_generales: "",
  });

  // Elemento
  const [elementoOpen, setElementoOpen] = useState(false);
  const [editingElemento, setEditingElemento] = useState<InspeccionElemento | null>(null);
  const [formElemento, setFormElemento] = useState(blankElemento());
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const fotoInputRef = useRef<HTMLInputElement>(null);

  // Acción correctiva
  const [accionOpen, setAccionOpen] = useState(false);
  const [editingAccion, setEditingAccion] = useState<AccionCorrectiva | null>(null);
  const [formAccion, setFormAccion] = useState(blankAccion());

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<{ type: "inspeccion" | "elemento" | "accion"; id: string } | null>(null);

  // Informe
  const [informeOpen, setInformeOpen] = useState(false);
  const [informeAnio, setInformeAnio] = useState<"actual" | "anterior">("actual");
  const [informeMeses, setInformeMeses] = useState<number[]>([]);
  const [informeData, setInformeData] = useState<Inspeccion[]>([]);
  const [informeGenerado, setInformeGenerado] = useState(false);

  const anioActual = new Date().getFullYear();

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchInspecciones = useCallback(async () => {
    if (!empresa?.id) return;
    setLoading(true);
    try {
      const { data } = await (supabase as any)
        .from("inspecciones").select("*").eq("empresa_id", empresa.id).order("fecha", { ascending: false });
      setInspecciones(data ?? []);
    } finally {
      setLoading(false);
    }
  }, [empresa?.id]);

  useEffect(() => { fetchInspecciones(); }, [fetchInspecciones]);

  useEffect(() => {
    if (!empresa?.id) return;
    (supabase as any).from("usuarios").select("id,nombre_completo,rol")
      .eq("empresa_id", empresa.id).in("rol", ["administrador", "asistente", "lector"])
      .then(({ data }: any) => setUsuarios(data ?? []));
    (supabase as any).from("empresas").select("logo_url").eq("id", empresa.id).maybeSingle()
      .then(({ data }: any) => setEmpresaLogo(data?.logo_url ?? null));
  }, [empresa?.id]);

  const fetchDetalle = async (insp: Inspeccion) => {
    setLoadingDetalle(true);
    const [{ data: elems }, { data: accs }] = await Promise.all([
      (supabase as any).from("inspeccion_elementos").select("*").eq("inspeccion_id", insp.id).order("numero"),
      (supabase as any).from("acciones_correctivas").select("*").eq("inspeccion_id", insp.id).order("created_at"),
    ]);
    setElementos(elems ?? []);
    setAcciones(accs ?? []);
    setLoadingDetalle(false);
  };

  const openDetalle = (insp: Inspeccion) => {
    setInspeccionActual(insp);
    fetchDetalle(insp);
    setDetalleOpen(true);
  };

  // ── Create inspection ──────────────────────────────────────────────────────

  const createInspeccion = async () => {
    if (!empresa?.id) return;
    setSaving(true);
    try {
      const { count } = await (supabase as any)
        .from("inspecciones").select("id", { count: "exact", head: true })
        .eq("empresa_id", empresa.id).eq("tipo", formInsp.tipo);
      const initials = getInitials((empresa as any).nombre ?? "EMP");
      const tipoShort = TIPO_CONFIG[formInsp.tipo]?.shortCode ?? "INS";
      const codigo = `${initials}-${tipoShort}-${String((count ?? 0) + 1).padStart(3, "0")}`;
      const { data, error } = await (supabase as any)
        .from("inspecciones").insert({
          empresa_id: empresa.id, tipo: formInsp.tipo, codigo,
          fecha: formInsp.fecha, estado: formInsp.estado,
          responsable: formInsp.responsable || null,
          observaciones_generales: formInsp.observaciones_generales || null,
        }).select().single();
      if (error) throw error;
      setNuevaOpen(false);
      fetchInspecciones();
      openDetalle(data);
      toast({ title: `Inspección ${codigo} creada` });
    } catch {
      toast({ title: "Error al crear la inspección", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const updateEstadoInsp = async (estado: string) => {
    if (!inspeccionActual) return;
    await (supabase as any).from("inspecciones")
      .update({ estado, updated_at: new Date().toISOString() }).eq("id", inspeccionActual.id);
    const updated = { ...inspeccionActual, estado };
    setInspeccionActual(updated);
    setInspecciones(prev => prev.map(i => i.id === inspeccionActual.id ? updated : i));
  };

  // ── Elemento ───────────────────────────────────────────────────────────────

  const saveElemento = async () => {
    if (!inspeccionActual || !empresa?.id) return;
    if (!formElemento.identificador.trim()) {
      toast({ title: "El identificador es requerido", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const numero = editingElemento ? editingElemento.numero : elementos.length + 1;
      const payload = {
        inspeccion_id: inspeccionActual.id, empresa_id: empresa.id, numero,
        identificador: formElemento.identificador,
        subtipo: formElemento.subtipo || null,
        checklist: formElemento.checklist,
        campos_libres: formElemento.campos_libres.filter(f => f.label.trim()),
        observaciones: formElemento.observaciones || null,
        foto_urls: formElemento.foto_urls,
      };
      if (editingElemento) {
        const { error } = await (supabase as any).from("inspeccion_elementos").update(payload).eq("id", editingElemento.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("inspeccion_elementos").insert(payload);
        if (error) throw error;
      }
      setElementoOpen(false);
      fetchDetalle(inspeccionActual);
      toast({ title: editingElemento ? "Elemento actualizado" : "Elemento agregado" });
    } catch {
      toast({ title: "Error al guardar el elemento", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const uploadFoto = async (file: File) => {
    if (!empresa?.id || !inspeccionActual) return;
    setUploadingFoto(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${empresa.id}/${inspeccionActual.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("inspecciones").upload(path, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("inspecciones").getPublicUrl(path);
      setFormElemento(prev => ({ ...prev, foto_urls: [...prev.foto_urls, urlData.publicUrl] }));
    } catch {
      toast({ title: "Error al subir la foto", variant: "destructive" });
    } finally {
      setUploadingFoto(false);
    }
  };

  // ── Acción correctiva ──────────────────────────────────────────────────────

  const saveAccion = async () => {
    if (!inspeccionActual || !empresa?.id) return;
    if (!formAccion.descripcion.trim()) {
      toast({ title: "La descripción es requerida", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        inspeccion_id: inspeccionActual.id, empresa_id: empresa.id,
        descripcion: formAccion.descripcion,
        responsable: formAccion.responsable || null,
        fecha_limite: formAccion.fecha_limite || null,
        estado: formAccion.estado,
      };
      if (editingAccion) {
        await (supabase as any).from("acciones_correctivas").update(payload).eq("id", editingAccion.id);
      } else {
        let tareaId: string | null = null;
        if (formAccion.fecha_limite) {
          const { data: t } = await (supabase as any).from("tareas").insert({
            empresa_id: empresa.id,
            titulo: `Acción correctiva: ${formAccion.descripcion.slice(0, 60)}`,
            descripcion: `Inspección ${inspeccionActual.codigo}`,
            fecha: formAccion.fecha_limite,
            responsable: formAccion.responsable || null,
            prioridad: "alta",
            estado: "pendiente",
          }).select("id").single();
          tareaId = t?.id ?? null;
        }
        await (supabase as any).from("acciones_correctivas").insert({ ...payload, tarea_id: tareaId });
      }
      setAccionOpen(false);
      fetchDetalle(inspeccionActual);
      toast({ title: editingAccion ? "Acción actualizada" : "Acción correctiva creada" });
    } catch {
      toast({ title: "Error al guardar", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const table = deleteTarget.type === "inspeccion" ? "inspecciones"
      : deleteTarget.type === "elemento" ? "inspeccion_elementos" : "acciones_correctivas";
    await (supabase as any).from(table).delete().eq("id", deleteTarget.id);
    setDeleteTarget(null);
    if (deleteTarget.type === "inspeccion") {
      setDetalleOpen(false);
      fetchInspecciones();
    } else if (inspeccionActual) {
      fetchDetalle(inspeccionActual);
    }
    toast({ title: "Eliminado correctamente" });
  };

  // ── Informe ────────────────────────────────────────────────────────────────

  const generarInforme = async () => {
    if (!empresa?.id) return;
    const anio = informeAnio === "actual" ? anioActual : anioActual - 1;
    const meses = informeMeses.length > 0 ? informeMeses : Array.from({ length: 12 }, (_, i) => i + 1);
    const { data } = await (supabase as any)
      .from("inspecciones").select("*").eq("empresa_id", empresa.id)
      .gte("fecha", `${anio}-01-01`).lte("fecha", `${anio}-12-31`).order("fecha");
    const filtered = (data ?? []).filter((insp: Inspeccion) => {
      const m = new Date(insp.fecha + "T00:00:00").getMonth() + 1;
      return meses.includes(m);
    });
    setInformeData(filtered);
    setInformeGenerado(true);
  };

  // ── Helpers ────────────────────────────────────────────────────────────────

  const getVisibleFields = (tipo: string, subtipo: string) =>
    (CHECKLIST_DEFS[tipo] ?? []).filter(f => !f.subtipos || f.subtipos.includes(subtipo));

  const setChecklistValue = (key: string, value: string) =>
    setFormElemento(prev => ({ ...prev, checklist: { ...prev.checklist, [key]: value } }));

  const getRatingCounts = (elem: InspeccionElemento) => {
    const fields = getVisibleFields(inspeccionActual?.tipo ?? "", elem.subtipo ?? "").filter(f => f.type === "rating");
    const M = fields.filter(f => elem.checklist[f.key] === "M").length;
    const B = fields.filter(f => elem.checklist[f.key] === "B").length;
    return { M, B, total: fields.length };
  };

  const inspeccionesFiltradas = inspecciones.filter(i => {
    if (filtroTipo && i.tipo !== filtroTipo) return false;
    if (filtroEstado && i.estado !== filtroEstado) return false;
    return true;
  });

  const fmtFecha = (f: string) =>
    new Date(f + "T00:00:00").toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <AppLayout breadcrumbs={["Inspecciones"]}>

      {/* Header */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <div>
          <h1 className="text-xl font-semibold">Inspecciones SST</h1>
          <p className="text-sm text-muted-foreground">Gestión de inspecciones de seguridad</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setInformeOpen(true); setInformeGenerado(false); }}>
            <Printer className="w-4 h-4 mr-1.5" /> Informe
          </Button>
          <Button size="sm" onClick={() => {
            setFormInsp({ tipo: "extintores", fecha: todayStr(), estado: "pendiente", responsable: "", observaciones_generales: "" });
            setNuevaOpen(true);
          }}>
            <Plus className="w-4 h-4 mr-1.5" /> Nueva Inspección
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total", value: inspecciones.length, icon: ClipboardCheck, color: "bg-indigo-100 text-indigo-600" },
          { label: "Pendientes", value: inspecciones.filter(i => i.estado === "pendiente").length, icon: Clock, color: "bg-gray-100 text-gray-600" },
          { label: "En proceso", value: inspecciones.filter(i => i.estado === "en-proceso").length, icon: AlertCircle, color: "bg-blue-100 text-blue-600" },
          { label: "Completadas", value: inspecciones.filter(i => i.estado === "completado").length, icon: CheckCircle2, color: "bg-green-100 text-green-600" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="border-none shadow-sm bg-surface">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">{label}</p>
                  <p className="text-xl font-bold">{value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <Select value={filtroTipo || "todos"} onValueChange={v => setFiltroTipo(v === "todos" ? "" : v)}>
          <SelectTrigger className="w-48 h-8 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los tipos</SelectItem>
            {Object.entries(TIPO_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filtroEstado || "todos"} onValueChange={v => setFiltroEstado(v === "todos" ? "" : v)}>
          <SelectTrigger className="w-36 h-8 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            <SelectItem value="pendiente">Pendiente</SelectItem>
            <SelectItem value="en-proceso">En proceso</SelectItem>
            <SelectItem value="completado">Completado</SelectItem>
            <SelectItem value="cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : inspeccionesFiltradas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <ClipboardCheck className="w-12 h-12 text-muted-foreground/40" />
          <p className="text-muted-foreground">Sin inspecciones registradas</p>
          <Button size="sm" onClick={() => setNuevaOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> Nueva Inspección
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Código</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Responsable</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {inspeccionesFiltradas.map(insp => (
                <TableRow key={insp.id} className="cursor-pointer hover:bg-muted/30" onClick={() => openDetalle(insp)}>
                  <TableCell>
                    <span className="font-mono text-sm font-semibold text-indigo-600">{insp.codigo}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] ${TIPO_CONFIG[insp.tipo]?.color ?? ""}`}>
                      {TIPO_CONFIG[insp.tipo]?.label ?? insp.tipo}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{fmtFecha(insp.fecha)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{insp.responsable || "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] ${ESTADO_COLOR[insp.estado] ?? ""}`}>
                      {insp.estado.replace("-", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openDetalle(insp)}>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget({ type: "inspeccion", id: insp.id })}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* ── Nueva Inspección Dialog ── */}
      <Dialog open={nuevaOpen} onOpenChange={setNuevaOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Nueva Inspección</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Tipo de inspección</Label>
              <Select value={formInsp.tipo} onValueChange={v => setFormInsp(p => ({ ...p, tipo: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TIPO_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Fecha</Label>
                <Input type="date" value={formInsp.fecha} onChange={e => setFormInsp(p => ({ ...p, fecha: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Estado</Label>
                <Select value={formInsp.estado} onValueChange={v => setFormInsp(p => ({ ...p, estado: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="en-proceso">En proceso</SelectItem>
                    <SelectItem value="completado">Completado</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Responsable</Label>
              <Select value={formInsp.responsable || ""} onValueChange={v => setFormInsp(p => ({ ...p, responsable: v }))}>
                <SelectTrigger><SelectValue placeholder="Seleccionar usuario..." /></SelectTrigger>
                <SelectContent>
                  {usuarios.map(u => (
                    <SelectItem key={u.id} value={u.nombre_completo}>
                      {u.nombre_completo}
                      <span className="ml-2 text-[10px] text-muted-foreground">{u.rol}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Observaciones generales</Label>
              <Textarea value={formInsp.observaciones_generales}
                onChange={e => setFormInsp(p => ({ ...p, observaciones_generales: e.target.value }))}
                rows={2} placeholder="Observaciones..." />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={createInspeccion} disabled={saving}>{saving ? "Creando..." : "Crear Inspección"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Detalle Dialog ── */}
      <Dialog open={detalleOpen} onOpenChange={setDetalleOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {inspeccionActual && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-mono text-lg font-bold text-indigo-600">{inspeccionActual.codigo}</span>
                  <Badge variant="outline" className={`text-[10px] ${TIPO_CONFIG[inspeccionActual.tipo]?.color ?? ""}`}>
                    {TIPO_CONFIG[inspeccionActual.tipo]?.label}
                  </Badge>
                  <Select value={inspeccionActual.estado} onValueChange={updateEstadoInsp}>
                    <SelectTrigger className="h-7 w-36 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendiente">Pendiente</SelectItem>
                      <SelectItem value="en-proceso">En proceso</SelectItem>
                      <SelectItem value="completado">Completado</SelectItem>
                      <SelectItem value="cancelado">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-sm text-muted-foreground">
                  {new Date(inspeccionActual.fecha + "T00:00:00").toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                  {inspeccionActual.responsable && ` · ${inspeccionActual.responsable}`}
                </p>
                {inspeccionActual.observaciones_generales && (
                  <p className="text-sm text-muted-foreground bg-muted/40 rounded p-2">{inspeccionActual.observaciones_generales}</p>
                )}
              </DialogHeader>

              <Tabs defaultValue="elementos" className="mt-2">
                <TabsList>
                  <TabsTrigger value="elementos">Elementos ({elementos.length})</TabsTrigger>
                  <TabsTrigger value="acciones">Acciones correctivas ({acciones.length})</TabsTrigger>
                </TabsList>

                {/* ── Elementos ── */}
                <TabsContent value="elementos">
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-sm text-muted-foreground">
                      {elementos.length === 0 ? "Agrega el primer elemento inspeccionado." : `${elementos.length} elemento(s)`}
                    </p>
                    <Button size="sm" onClick={() => { setEditingElemento(null); setFormElemento(blankElemento()); setElementoOpen(true); }}>
                      <Plus className="w-4 h-4 mr-1.5" /> Agregar elemento
                    </Button>
                  </div>
                  {loadingDetalle ? (
                    <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
                  ) : (
                    <div className="space-y-2">
                      {elementos.map((elem, idx) => {
                        const { M, B, total } = getRatingCounts(elem);
                        return (
                          <div key={elem.id} className="flex items-start gap-3 p-3 rounded-lg border bg-surface hover:bg-muted/20 transition-colors">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-bold shrink-0">
                              {idx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-medium text-sm">{elem.identificador}</p>
                                {elem.subtipo && (
                                  <Badge variant="outline" className="text-[10px]">
                                    {TIPO_CONFIG[inspeccionActual.tipo]?.subtipos?.find(s => s.value === elem.subtipo)?.label ?? elem.subtipo.toUpperCase()}
                                  </Badge>
                                )}
                              </div>
                              {total > 0 && (
                                <div className="flex gap-3 mt-1 text-xs">
                                  <span className="text-green-600 font-medium">B: {B}</span>
                                  <span className="text-red-600 font-medium">M: {M}</span>
                                  <span className="text-muted-foreground">/ {total} ítems</span>
                                </div>
                              )}
                              {elem.observaciones && (
                                <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-xs">{elem.observaciones}</p>
                              )}
                            </div>
                            {elem.foto_urls.length > 0 && (
                              <div className="flex gap-1 shrink-0">
                                {elem.foto_urls.slice(0, 2).map((url, i) => (
                                  <img key={i} src={url} alt="" className="w-10 h-10 rounded object-cover" />
                                ))}
                                {elem.foto_urls.length > 2 && (
                                  <div className="w-10 h-10 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">
                                    +{elem.foto_urls.length - 2}
                                  </div>
                                )}
                              </div>
                            )}
                            <div className="flex gap-1 shrink-0">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                                setEditingElemento(elem);
                                setFormElemento({
                                  identificador: elem.identificador,
                                  subtipo: elem.subtipo ?? "",
                                  checklist: { ...elem.checklist },
                                  campos_libres: elem.campos_libres.length > 0 ? [...elem.campos_libres] : [{ label: "", valor: "" }],
                                  observaciones: elem.observaciones ?? "",
                                  foto_urls: [...elem.foto_urls],
                                });
                                setElementoOpen(true);
                              }}>
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                                onClick={() => setDeleteTarget({ type: "elemento", id: elem.id })}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>

                {/* ── Acciones Correctivas ── */}
                <TabsContent value="acciones">
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-sm text-muted-foreground">
                      {acciones.length === 0 ? "Sin acciones correctivas." : `${acciones.length} acción(es)`}
                    </p>
                    <Button size="sm" onClick={() => { setEditingAccion(null); setFormAccion(blankAccion()); setAccionOpen(true); }}>
                      <Plus className="w-4 h-4 mr-1.5" /> Agregar acción
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {acciones.map(acc => (
                      <div key={acc.id} className="flex items-start gap-3 p-3 rounded-lg border bg-surface">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{acc.descripcion}</p>
                          <div className="flex gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                            {acc.responsable && <span>Resp: {acc.responsable}</span>}
                            {acc.fecha_limite && <span>Límite: {fmtFecha(acc.fecha_limite)}</span>}
                            {acc.tarea_id && <span className="text-green-600 font-medium">✓ En calendario</span>}
                          </div>
                        </div>
                        <Badge variant="outline" className={`text-[10px] shrink-0 ${ESTADO_COLOR[acc.estado] ?? ""}`}>
                          {acc.estado.replace("-", " ")}
                        </Badge>
                        <div className="flex gap-1 shrink-0">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                            setEditingAccion(acc);
                            setFormAccion({ descripcion: acc.descripcion, responsable: acc.responsable ?? "", fecha_limite: acc.fecha_limite ?? "", estado: acc.estado });
                            setAccionOpen(true);
                          }}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget({ type: "accion", id: acc.id })}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Elemento Dialog ── */}
      <Dialog open={elementoOpen} onOpenChange={setElementoOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingElemento ? "Editar elemento" : "Agregar elemento"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">

            {/* Identificador + subtipo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Identificador *</Label>
                <Input
                  value={formElemento.identificador}
                  onChange={e => setFormElemento(p => ({ ...p, identificador: e.target.value }))}
                  placeholder={inspeccionActual?.tipo === "extintores" ? "Ej: Extintor #1 - Piso 2" : "Nombre o referencia"}
                />
              </div>
              {inspeccionActual && TIPO_CONFIG[inspeccionActual.tipo]?.subtipos && (
                <div className="space-y-1.5">
                  <Label>Subtipo</Label>
                  <Select value={formElemento.subtipo || ""} onValueChange={v => setFormElemento(p => ({ ...p, subtipo: v, checklist: {} }))}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                    <SelectContent>
                      {TIPO_CONFIG[inspeccionActual.tipo].subtipos!.map(s => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Checklist fields */}
            {inspeccionActual && (() => {
              const fields = getVisibleFields(inspeccionActual.tipo, formElemento.subtipo);
              const infoFields = fields.filter(f => f.type !== "rating");
              const ratingFields = fields.filter(f => f.type === "rating");
              return (
                <div className="space-y-4">
                  {/* Info fields (text, date, select) */}
                  {infoFields.length > 0 && (
                    <div className="grid grid-cols-2 gap-3">
                      {infoFields.map(f => (
                        <div key={f.key} className="space-y-1">
                          <Label className="text-xs">{f.label}</Label>
                          {f.type === "select" ? (
                            <Select value={formElemento.checklist[f.key] ?? ""} onValueChange={v => setChecklistValue(f.key, v)}>
                              <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                              <SelectContent>{f.options?.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                            </Select>
                          ) : (
                            <Input type={f.type === "date" ? "date" : "text"} className="h-8 text-sm"
                              value={formElemento.checklist[f.key] ?? ""}
                              onChange={e => setChecklistValue(f.key, e.target.value)} />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Rating items */}
                  {ratingFields.length > 0 && (
                    <div className="space-y-1.5">
                      <Label className="text-[11px] text-muted-foreground uppercase tracking-wide">
                        Verificación — B: Bueno · M: Malo · N/A: No aplica
                      </Label>
                      <div className="rounded-lg border overflow-hidden">
                        {ratingFields.map((f, i) => {
                          const val = formElemento.checklist[f.key];
                          return (
                            <div key={f.key} className={`flex items-center justify-between px-3 py-2 ${i % 2 === 0 ? "bg-background" : "bg-muted/20"}`}>
                              <span className="text-sm">{f.label}</span>
                              <div className="flex gap-1">
                                {(["B", "M", "NA"] as const).map(opt => (
                                  <button key={opt} type="button" onClick={() => setChecklistValue(f.key, opt)}
                                    className={`px-2.5 py-0.5 rounded text-xs font-medium border transition-colors ${
                                      val === opt
                                        ? opt === "B" ? "bg-green-500 text-white border-green-500"
                                          : opt === "M" ? "bg-red-500 text-white border-red-500"
                                          : "bg-gray-400 text-white border-gray-400"
                                        : "bg-background border-border text-muted-foreground hover:border-gray-400"
                                    }`}>
                                    {opt}
                                  </button>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Campos libres */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-[11px] text-muted-foreground uppercase tracking-wide">Campos adicionales</Label>
                {formElemento.campos_libres.length < 3 && (
                  <button type="button" className="text-xs text-indigo-600 hover:underline"
                    onClick={() => setFormElemento(p => ({ ...p, campos_libres: [...p.campos_libres, { label: "", valor: "" }] }))}>
                    + Agregar campo
                  </button>
                )}
              </div>
              {formElemento.campos_libres.map((cf, i) => (
                <div key={i} className="grid grid-cols-[1fr_2fr_auto] gap-2">
                  <Input className="h-8 text-sm" placeholder="Etiqueta" value={cf.label}
                    onChange={e => {
                      const arr = [...formElemento.campos_libres];
                      arr[i] = { ...arr[i], label: e.target.value };
                      setFormElemento(p => ({ ...p, campos_libres: arr }));
                    }} />
                  <Input className="h-8 text-sm" placeholder="Valor" value={cf.valor}
                    onChange={e => {
                      const arr = [...formElemento.campos_libres];
                      arr[i] = { ...arr[i], valor: e.target.value };
                      setFormElemento(p => ({ ...p, campos_libres: arr }));
                    }} />
                  <button type="button" onClick={() => setFormElemento(p => ({ ...p, campos_libres: p.campos_libres.filter((_, j) => j !== i) }))}
                    className="h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-destructive">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Observaciones */}
            <div className="space-y-1.5">
              <Label>Observaciones del elemento</Label>
              <Textarea value={formElemento.observaciones}
                onChange={e => setFormElemento(p => ({ ...p, observaciones: e.target.value }))}
                rows={2} placeholder="Observaciones..." />
            </div>

            {/* Fotos */}
            <div className="space-y-2">
              <Label className="text-[11px] text-muted-foreground uppercase tracking-wide">Fotos (máx. 5)</Label>
              <div className="flex flex-wrap gap-2">
                {formElemento.foto_urls.map((url, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border">
                    <img src={url} alt={`foto ${i + 1}`} className="w-full h-full object-cover" />
                    <button type="button"
                      onClick={() => setFormElemento(p => ({ ...p, foto_urls: p.foto_urls.filter((_, j) => j !== i) }))}
                      className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {formElemento.foto_urls.length < 5 && (
                  <button type="button" onClick={() => fotoInputRef.current?.click()} disabled={uploadingFoto}
                    className="w-20 h-20 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground hover:border-indigo-400 hover:text-indigo-600 transition-colors disabled:opacity-50">
                    <Camera className="w-5 h-5 mb-1" />
                    <span className="text-[10px]">{uploadingFoto ? "Subiendo..." : "Foto"}</span>
                  </button>
                )}
                <input ref={fotoInputRef} type="file" accept="image/*" capture="environment" className="hidden"
                  onChange={e => { const file = e.target.files?.[0]; if (file) { uploadFoto(file); e.target.value = ""; } }} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={saveElemento} disabled={saving || uploadingFoto}>
              {saving ? "Guardando..." : editingElemento ? "Actualizar" : "Agregar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Acción Correctiva Dialog ── */}
      <Dialog open={accionOpen} onOpenChange={setAccionOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingAccion ? "Editar acción" : "Nueva acción correctiva"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Descripción *</Label>
              <Textarea value={formAccion.descripcion}
                onChange={e => setFormAccion(p => ({ ...p, descripcion: e.target.value }))}
                rows={3} placeholder="Describe la acción correctiva..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Responsable</Label>
                <Select value={formAccion.responsable || ""} onValueChange={v => setFormAccion(p => ({ ...p, responsable: v }))}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                  <SelectContent>
                    {usuarios.map(u => <SelectItem key={u.id} value={u.nombre_completo}>{u.nombre_completo}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Fecha límite</Label>
                <Input type="date" value={formAccion.fecha_limite}
                  onChange={e => setFormAccion(p => ({ ...p, fecha_limite: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Estado</Label>
              <Select value={formAccion.estado} onValueChange={v => setFormAccion(p => ({ ...p, estado: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="en-proceso">En proceso</SelectItem>
                  <SelectItem value="completado">Completado</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {!editingAccion && formAccion.fecha_limite && (
              <p className="text-xs bg-blue-50 text-blue-700 p-2 rounded">
                Se creará una tarea automáticamente en el Calendario SST.
              </p>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={saveAccion} disabled={saving}>{saving ? "Guardando..." : editingAccion ? "Actualizar" : "Crear acción"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Informe Dialog ── */}
      <Dialog open={informeOpen} onOpenChange={v => { setInformeOpen(v); if (!v) setInformeGenerado(false); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Informe de Inspecciones</DialogTitle></DialogHeader>

          <div className="space-y-4 print:hidden">
            <div className="flex gap-2 items-center">
              <Label className="text-sm shrink-0">Año:</Label>
              {(["actual", "anterior"] as const).map(a => (
                <button key={a} onClick={() => { setInformeAnio(a); setInformeGenerado(false); }}
                  className={`px-3 py-1 rounded-md text-sm border transition-colors ${
                    informeAnio === a ? "bg-indigo-600 text-white border-indigo-600" : "border-border text-muted-foreground hover:border-indigo-400"
                  }`}>
                  {a === "actual" ? anioActual : anioActual - 1}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Meses (vacío = todos):</Label>
              <div className="flex flex-wrap gap-1.5">
                {MESES.map((m, i) => {
                  const mes = i + 1;
                  const active = informeMeses.includes(mes);
                  return (
                    <button key={mes} onClick={() => { setInformeMeses(prev => prev.includes(mes) ? prev.filter(x => x !== mes) : [...prev, mes].sort((a,b)=>a-b)); setInformeGenerado(false); }}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                        active ? "bg-indigo-600 text-white border-indigo-600" : "border-border text-muted-foreground hover:border-indigo-400"
                      }`}>
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={generarInforme}>Generar informe</Button>
              {informeGenerado && (
                <Button variant="outline" onClick={() => window.print()}>
                  <Printer className="w-4 h-4 mr-1.5" /> Imprimir
                </Button>
              )}
            </div>
          </div>

          {/* Print header */}
          <div className="hidden print:flex items-center gap-4 mb-6">
            {empresaLogo && <img src={empresaLogo} alt="Logo" className="h-14 object-contain" />}
            <div>
              <h2 className="text-xl font-bold">Informe de Inspecciones SST</h2>
              <p className="text-sm text-muted-foreground">
                {informeAnio === "actual" ? anioActual : anioActual - 1}
                {informeMeses.length > 0 ? ` · ${informeMeses.map(m => MESES[m - 1]).join(", ")}` : " · Todos los meses"}
              </p>
            </div>
          </div>

          {informeGenerado && (
            <div className="mt-4">
              {informeData.length === 0 ? (
                <p className="text-muted-foreground text-sm py-6 text-center">Sin inspecciones en el período seleccionado.</p>
              ) : (
                <div className="rounded-lg border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead>Código</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Responsable</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {informeData.map(insp => (
                        <TableRow key={insp.id}>
                          <TableCell><span className="font-mono text-sm font-semibold text-indigo-600">{insp.codigo}</span></TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-[10px] ${TIPO_CONFIG[insp.tipo]?.color ?? ""}`}>
                              {TIPO_CONFIG[insp.tipo]?.label ?? insp.tipo}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">{fmtFecha(insp.fecha)}</TableCell>
                          <TableCell className="text-sm">{insp.responsable || "—"}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-[10px] ${ESTADO_COLOR[insp.estado] ?? ""}`}>
                              {insp.estado.replace("-", " ")}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm ── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </AppLayout>
  );
}
