import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  FileText, Plus, Trash2, Download, FolderOpen, Search,
  AlertTriangle, CheckCircle2, Clock, Upload, FolderPlus, Users,
  Building2, ShieldCheck, ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DocEmpresa {
  id: string;
  nombre: string;
  tipo: string | null;
  estado: string;
  url: string | null;
  fecha_vencimiento: string | null;
  tiene_vencimiento?: boolean;
  created_at: string;
}

interface DocSgsst {
  id: string;
  nombre: string;
  tipo: string | null;
  estado: string;
  url: string | null;
  version: number | null;
  carpeta_id: string | null;
  tiene_vencimiento?: boolean;
  fecha_vencimiento?: string | null;
  created_at: string;
}

interface Carpeta {
  id: string;
  nombre: string;
  descripcion: string | null;
  orden: number | null;
}

interface DocTrabajador {
  id: string;
  nombre: string;
  tipo: string | null;
  estado: string;
  url: string | null;
  fecha_vencimiento: string | null;
  trabajador_id: string;
  trabajador_nombre?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TIPOS_EMPRESA = ["Certificación","Licencia","Contrato","Seguro","Planilla","RUT","Cámara de Comercio","Resolución","Otro"];
const TIPOS_SGSST   = ["Política","Procedimiento","Formato","Manual","Plan","Registro","Protocolo","Otro"];
const TIPOS_TRAB    = ["Hoja de vida","Contrato","ARL","EPS","Caja compensación","Libreta militar","Certificado","Otro"];

const today = new Date().toISOString().slice(0, 10);
const in30  = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

function vencimientoStatus(fecha: string | null | undefined): "vencido" | "proximo" | "vigente" | "sin" {
  if (!fecha) return "sin";
  if (fecha < today) return "vencido";
  if (fecha <= in30)  return "proximo";
  return "vigente";
}

const STATUS_CONFIG = {
  vencido: { label: "Vencido",      cls: "bg-red-100 text-red-700 border-red-200",    icon: AlertTriangle },
  proximo: { label: "Próx. vencer", cls: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: Clock },
  vigente: { label: "Vigente",      cls: "bg-green-100 text-green-700 border-green-200",   icon: CheckCircle2 },
  sin:     { label: "Sin vencimiento", cls: "bg-gray-100 text-gray-500 border-gray-200",  icon: FileText },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function VencimientoBadge({ fecha }: { fecha: string | null | undefined }) {
  const st = vencimientoStatus(fecha);
  const { label, cls, icon: Icon } = STATUS_CONFIG[st];
  if (st === "sin") return null;
  return (
    <Badge variant="outline" className={cn("text-[10px] flex items-center gap-1", cls)}>
      <Icon className="h-2.5 w-2.5" />
      {st !== "sin" && fecha
        ? new Date(fecha + "T00:00:00").toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })
        : label}
    </Badge>
  );
}

function DocRow({
  nombre, tipo, estado, url, fecha_vencimiento, onDelete, extra,
}: {
  nombre: string; tipo: string | null; estado: string; url: string | null;
  fecha_vencimiento?: string | null; onDelete: () => void; extra?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b last:border-0 group">
      <FileText className="w-4 h-4 text-muted-foreground/40 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium truncate">{nombre}</p>
        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
          {tipo && <Badge variant="outline" className="text-[10px] h-4 px-1">{tipo}</Badge>}
          {extra}
          <VencimientoBadge fecha={fecha_vencimiento} />
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {url && (
          <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
            <a href={url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Button>
        )}
        <Button
          variant="ghost" size="icon"
          className="h-7 w-7 text-destructive hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ─── Upload dialog ─────────────────────────────────────────────────────────────

interface UploadDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    nombre: string; tipo: string; archivo: File | null;
    fecha_vencimiento: string; tiene_vencimiento: boolean;
    carpeta_id?: string;
  }) => Promise<void>;
  tipos: string[];
  carpetas?: Carpeta[];
  titulo: string;
  saving: boolean;
}

function UploadDialog({ open, onClose, onSave, tipos, carpetas, titulo, saving }: UploadDialogProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState("");
  const [tieneVencimiento, setTieneVencimiento] = useState(false);
  const [fechaVenc, setFechaVenc] = useState("");
  const [carpetaId, setCarpetaId] = useState("");
  const [archivo, setArchivo] = useState<File | null>(null);

  const reset = () => {
    setNombre(""); setTipo(""); setTieneVencimiento(false);
    setFechaVenc(""); setCarpetaId(""); setArchivo(null);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setArchivo(f);
    if (f && !nombre) setNombre(f.name.replace(/\.[^.]+$/, ""));
  };

  const handleSave = async () => {
    await onSave({ nombre, tipo, archivo, fecha_vencimiento: fechaVenc, tiene_vencimiento: tieneVencimiento, carpeta_id: carpetaId || undefined });
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{titulo}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          {/* Archivo */}
          <div
            className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/40 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            {archivo ? (
              <p className="text-sm font-medium truncate">{archivo.name}</p>
            ) : (
              <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
                <Upload className="h-6 w-6" />
                <p className="text-sm">Haz clic para seleccionar archivo</p>
                <p className="text-[11px]">PDF, Word, Excel, imagen…</p>
              </div>
            )}
            <input ref={fileRef} type="file" className="hidden" onChange={handleFile} />
          </div>

          <div className="space-y-1.5">
            <Label>Nombre del documento *</Label>
            <Input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre descriptivo" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger><SelectValue placeholder="Tipo…" /></SelectTrigger>
                <SelectContent>{tipos.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {carpetas && (
              <div className="space-y-1.5">
                <Label>Carpeta</Label>
                <Select value={carpetaId} onValueChange={setCarpetaId}>
                  <SelectTrigger><SelectValue placeholder="Sin carpeta" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">Sin carpeta</SelectItem>
                    {carpetas.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Switch checked={tieneVencimiento} onCheckedChange={setTieneVencimiento} id="venc-sw" />
            <Label htmlFor="venc-sw" className="cursor-pointer">Tiene fecha de vencimiento</Label>
          </div>
          {tieneVencimiento && (
            <div className="space-y-1.5">
              <Label>Fecha de vencimiento</Label>
              <Input type="date" value={fechaVenc} onChange={e => setFechaVenc(e.target.value)} />
            </div>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline" onClick={handleClose}>Cancelar</Button></DialogClose>
          <Button onClick={handleSave} disabled={saving || !nombre.trim()}>
            {saving ? "Subiendo…" : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function Documentos() {
  const { empresa } = useAuth();
  const { toast } = useToast();

  // Empresa docs
  const [docsEmpresa, setDocsEmpresa] = useState<DocEmpresa[]>([]);
  const [loadingEmp, setLoadingEmp] = useState(true);
  const [uploadEmpOpen, setUploadEmpOpen] = useState(false);
  const [savingEmp, setSavingEmp] = useState(false);
  const [searchEmp, setSearchEmp] = useState("");

  // SG-SST docs
  const [docsSgsst, setDocsSgsst] = useState<DocSgsst[]>([]);
  const [carpetas, setCarpetas] = useState<Carpeta[]>([]);
  const [loadingSgsst, setLoadingSgsst] = useState(true);
  const [uploadSgsstOpen, setUploadSgsstOpen] = useState(false);
  const [savingSgsst, setSavingSgsst] = useState(false);
  const [searchSgsst, setSearchSgsst] = useState("");
  const [carpetaDialog, setCarpetaDialog] = useState(false);
  const [nuevaCarpeta, setNuevaCarpeta] = useState({ nombre: "", descripcion: "" });
  const [savingCarpeta, setSavingCarpeta] = useState(false);

  // Trabajadores docs
  const [docsTrab, setDocsTrab] = useState<DocTrabajador[]>([]);
  const [loadingTrab, setLoadingTrab] = useState(true);
  const [searchTrab, setSearchTrab] = useState("");

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<{ table: string; id: string; url?: string | null } | null>(null);

  // ── Fetch empresa docs ──────────────────────────────────────────────────────

  const fetchEmpresa = useCallback(async () => {
    if (!empresa?.id) return;
    setLoadingEmp(true);
    const { data } = await supabase
      .from("documentos_empresa")
      .select("*")
      .eq("empresa_id", empresa.id)
      .order("created_at", { ascending: false });
    setDocsEmpresa(data ?? []);
    setLoadingEmp(false);
  }, [empresa?.id]);

  // ── Fetch SG-SST docs ───────────────────────────────────────────────────────

  const fetchSgsst = useCallback(async () => {
    if (!empresa?.id) return;
    setLoadingSgsst(true);
    const [{ data: docs }, { data: carps }] = await Promise.all([
      (supabase as any)
        .from("documentos_sgsst")
        .select("*")
        .eq("empresa_id", empresa.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("carpetas_sgsst")
        .select("*")
        .eq("empresa_id", empresa.id)
        .order("orden"),
    ]);
    setDocsSgsst(docs ?? []);
    setCarpetas(carps ?? []);
    setLoadingSgsst(false);
  }, [empresa?.id]);

  // ── Fetch trabajadores docs ─────────────────────────────────────────────────

  const fetchTrab = useCallback(async () => {
    if (!empresa?.id) return;
    setLoadingTrab(true);
    const { data: docs } = await supabase
      .from("documentos_trabajador")
      .select("*, trabajadores(nombres, apellidos)")
      .eq("empresa_id", empresa.id)
      .order("created_at", { ascending: false });
    const mapped: DocTrabajador[] = (docs ?? []).map((d: any) => ({
      id: d.id,
      nombre: d.nombre,
      tipo: d.tipo,
      estado: d.estado,
      url: d.url,
      fecha_vencimiento: d.fecha_vencimiento,
      trabajador_id: d.trabajador_id,
      trabajador_nombre: d.trabajadores
        ? `${d.trabajadores.nombres} ${d.trabajadores.apellidos}`
        : "Trabajador",
    }));
    setDocsTrab(mapped);
    setLoadingTrab(false);
  }, [empresa?.id]);

  useEffect(() => {
    fetchEmpresa(); fetchSgsst(); fetchTrab();
  }, [fetchEmpresa, fetchSgsst, fetchTrab]);

  // ── Upload to storage ───────────────────────────────────────────────────────

  const uploadFile = async (archivo: File, path: string) => {
    const { error } = await supabase.storage.from("documentos").upload(path, archivo, { upsert: true });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from("documentos").getPublicUrl(path);
    return publicUrl;
  };

  // ── Save empresa doc ────────────────────────────────────────────────────────

  const saveEmpresaDoc = async ({ nombre, tipo, archivo, fecha_vencimiento, tiene_vencimiento }: any) => {
    if (!empresa?.id) return;
    setSavingEmp(true);
    try {
      let url: string | null = null;
      if (archivo) {
        const ext = archivo.name.split(".").pop();
        url = await uploadFile(archivo, `empresa/${empresa.id}/${Date.now()}.${ext}`);
      }
      const { error } = await supabase.from("documentos_empresa").insert({
        empresa_id: empresa.id,
        nombre,
        tipo: tipo || null,
        estado: "activo",
        url,
        fecha_vencimiento: tiene_vencimiento && fecha_vencimiento ? fecha_vencimiento : null,
      });
      if (error) throw error;
      setUploadEmpOpen(false);
      fetchEmpresa();
      toast({ title: "Documento guardado" });
    } catch {
      toast({ title: "Error al guardar", variant: "destructive" });
    } finally {
      setSavingEmp(false);
    }
  };

  // ── Save SG-SST doc ─────────────────────────────────────────────────────────

  const saveSgsstDoc = async ({ nombre, tipo, archivo, fecha_vencimiento, tiene_vencimiento, carpeta_id }: any) => {
    if (!empresa?.id) return;
    setSavingSgsst(true);
    try {
      let url: string | null = null;
      if (archivo) {
        const ext = archivo.name.split(".").pop();
        url = await uploadFile(archivo, `sgsst/${empresa.id}/${Date.now()}.${ext}`);
      }
      const { error } = await (supabase as any).from("documentos_sgsst").insert({
        empresa_id: empresa.id,
        nombre,
        tipo: tipo || null,
        estado: "activo",
        url,
        carpeta_id: carpeta_id && carpeta_id !== "__none" ? carpeta_id : null,
        tiene_vencimiento: tiene_vencimiento,
        fecha_vencimiento: tiene_vencimiento && fecha_vencimiento ? fecha_vencimiento : null,
        version: 1,
      });
      if (error) throw error;
      setUploadSgsstOpen(false);
      fetchSgsst();
      toast({ title: "Documento guardado" });
    } catch {
      toast({ title: "Error al guardar", variant: "destructive" });
    } finally {
      setSavingSgsst(false);
    }
  };

  // ── Create carpeta ──────────────────────────────────────────────────────────

  const crearCarpeta = async () => {
    if (!empresa?.id || !nuevaCarpeta.nombre.trim()) return;
    setSavingCarpeta(true);
    const { error } = await supabase.from("carpetas_sgsst").insert({
      empresa_id: empresa.id,
      nombre: nuevaCarpeta.nombre,
      descripcion: nuevaCarpeta.descripcion || null,
    });
    setSavingCarpeta(false);
    if (error) {
      toast({ title: "Error al crear carpeta", variant: "destructive" });
    } else {
      setCarpetaDialog(false);
      setNuevaCarpeta({ nombre: "", descripcion: "" });
      fetchSgsst();
      toast({ title: "Carpeta creada" });
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────────

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const { table, id, url } = deleteTarget;
    if (url) {
      // Extract storage path from URL
      const parts = url.split("/documentos/");
      if (parts[1]) {
        await supabase.storage.from("documentos").remove([parts[1]]);
      }
    }
    await (supabase as any).from(table).delete().eq("id", id);
    setDeleteTarget(null);
    if (table === "documentos_empresa") fetchEmpresa();
    else if (table === "documentos_sgsst") fetchSgsst();
    toast({ title: "Documento eliminado" });
  };

  // ── Filter helpers ──────────────────────────────────────────────────────────

  const filteredEmp  = docsEmpresa.filter(d => d.nombre.toLowerCase().includes(searchEmp.toLowerCase()));
  const filteredSgsst = docsSgsst.filter(d => d.nombre.toLowerCase().includes(searchSgsst.toLowerCase()));
  const filteredTrab = docsTrab.filter(d =>
    d.nombre.toLowerCase().includes(searchTrab.toLowerCase()) ||
    (d.trabajador_nombre ?? "").toLowerCase().includes(searchTrab.toLowerCase())
  );

  // SG-SST grouped by carpeta
  const sinCarpeta = filteredSgsst.filter(d => !d.carpeta_id);
  const porCarpeta = carpetas.map(c => ({
    carpeta: c,
    docs: filteredSgsst.filter(d => d.carpeta_id === c.id),
  }));

  // Alerts summary
  const vencidosCount  = [...docsEmpresa, ...docsSgsst].filter(d => vencimientoStatus((d as any).fecha_vencimiento) === "vencido").length;
  const proximosCount  = [...docsEmpresa, ...docsSgsst].filter(d => vencimientoStatus((d as any).fecha_vencimiento) === "proximo").length;

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <AppLayout breadcrumbs={["Documentos"]}>
      <div className="max-w-5xl space-y-4">

        {/* Alerts summary */}
        {(vencidosCount > 0 || proximosCount > 0) && (
          <div className="flex flex-wrap gap-2">
            {vencidosCount > 0 && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                <AlertTriangle className="h-4 w-4" />
                <span><strong>{vencidosCount}</strong> documento{vencidosCount > 1 ? "s" : ""} vencido{vencidosCount > 1 ? "s" : ""}</span>
              </div>
            )}
            {proximosCount > 0 && (
              <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 text-yellow-700 px-3 py-2 rounded-lg text-sm">
                <Clock className="h-4 w-4" />
                <span><strong>{proximosCount}</strong> próximo{proximosCount > 1 ? "s" : ""} a vencer (30 días)</span>
              </div>
            )}
          </div>
        )}

        <Tabs defaultValue="empresa">
          <TabsList>
            <TabsTrigger value="empresa" className="flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5" /> Empresa
              <span className="text-[10px] bg-muted rounded-full px-1.5">{docsEmpresa.length}</span>
            </TabsTrigger>
            <TabsTrigger value="sgsst" className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" /> SG-SST
              <span className="text-[10px] bg-muted rounded-full px-1.5">{docsSgsst.length}</span>
            </TabsTrigger>
            <TabsTrigger value="trabajadores" className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" /> Trabajadores
              <span className="text-[10px] bg-muted rounded-full px-1.5">{docsTrab.length}</span>
            </TabsTrigger>
          </TabsList>

          {/* ── EMPRESA ── */}
          <TabsContent value="empresa" className="mt-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={searchEmp}
                  onChange={e => setSearchEmp(e.target.value)}
                  placeholder="Buscar documento…"
                  className="pl-8 h-8 text-sm"
                />
              </div>
              <Button size="sm" onClick={() => setUploadEmpOpen(true)}>
                <Plus className="h-4 w-4 mr-1.5" /> Subir documento
              </Button>
            </div>

            {loadingEmp ? (
              <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : filteredEmp.length === 0 ? (
              <Empty icon={FileText} label={searchEmp ? "Sin resultados" : "Sin documentos de empresa"} onAdd={() => setUploadEmpOpen(true)} showAdd={!searchEmp} />
            ) : (
              <div className="bg-surface rounded-xl border-[0.5px] border-border divide-y px-4">
                {filteredEmp.map(d => (
                  <DocRow
                    key={d.id}
                    nombre={d.nombre}
                    tipo={d.tipo}
                    estado={d.estado}
                    url={d.url}
                    fecha_vencimiento={d.fecha_vencimiento}
                    onDelete={() => setDeleteTarget({ table: "documentos_empresa", id: d.id, url: d.url })}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── SG-SST ── */}
          <TabsContent value="sgsst" className="mt-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={searchSgsst}
                  onChange={e => setSearchSgsst(e.target.value)}
                  placeholder="Buscar documento…"
                  className="pl-8 h-8 text-sm"
                />
              </div>
              <Button variant="outline" size="sm" onClick={() => setCarpetaDialog(true)}>
                <FolderPlus className="h-4 w-4 mr-1.5" /> Carpeta
              </Button>
              <Button size="sm" onClick={() => setUploadSgsstOpen(true)}>
                <Plus className="h-4 w-4 mr-1.5" /> Subir documento
              </Button>
            </div>

            {loadingSgsst ? (
              <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : docsSgsst.length === 0 && carpetas.length === 0 ? (
              <Empty icon={ShieldCheck} label="Sin documentos SG-SST" onAdd={() => setUploadSgsstOpen(true)} showAdd />
            ) : (
              <div className="space-y-4">
                {/* Carpetas con docs */}
                {porCarpeta.map(({ carpeta, docs }) => (
                  <div key={carpeta.id}>
                    <div className="flex items-center gap-2 mb-1">
                      <FolderOpen className="h-4 w-4 text-indigo-400" />
                      <h4 className="text-[13px] font-medium">{carpeta.nombre}</h4>
                      <span className="text-[10px] text-muted-foreground">({docs.length})</span>
                    </div>
                    {docs.length === 0 ? (
                      <p className="text-[12px] text-muted-foreground pl-6">Carpeta vacía</p>
                    ) : (
                      <div className="bg-surface rounded-xl border-[0.5px] border-border divide-y px-4 ml-2">
                        {docs.map(d => (
                          <DocRow
                            key={d.id}
                            nombre={d.nombre}
                            tipo={d.tipo}
                            estado={d.estado}
                            url={d.url}
                            fecha_vencimiento={d.fecha_vencimiento}
                            onDelete={() => setDeleteTarget({ table: "documentos_sgsst", id: d.id, url: d.url })}
                            extra={d.version ? <span className="text-[10px] text-muted-foreground">v{d.version}</span> : undefined}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* Sin carpeta */}
                {sinCarpeta.length > 0 && (
                  <div>
                    {carpetas.length > 0 && (
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="h-4 w-4 text-muted-foreground/40" />
                        <h4 className="text-[13px] font-medium text-muted-foreground">Sin carpeta</h4>
                      </div>
                    )}
                    <div className="bg-surface rounded-xl border-[0.5px] border-border divide-y px-4">
                      {sinCarpeta.map(d => (
                        <DocRow
                          key={d.id}
                          nombre={d.nombre}
                          tipo={d.tipo}
                          estado={d.estado}
                          url={d.url}
                          fecha_vencimiento={d.fecha_vencimiento}
                          onDelete={() => setDeleteTarget({ table: "documentos_sgsst", id: d.id, url: d.url })}
                          extra={d.version ? <span className="text-[10px] text-muted-foreground">v{d.version}</span> : undefined}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* ── TRABAJADORES ── */}
          <TabsContent value="trabajadores" className="mt-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={searchTrab}
                  onChange={e => setSearchTrab(e.target.value)}
                  placeholder="Buscar por trabajador o documento…"
                  className="pl-8 h-8 text-sm"
                />
              </div>
            </div>

            {loadingTrab ? (
              <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : filteredTrab.length === 0 ? (
              <Empty icon={Users} label="Sin documentos de trabajadores" showAdd={false} onAdd={() => {}} />
            ) : (
              <div className="bg-surface rounded-xl border-[0.5px] border-border divide-y px-4">
                {filteredTrab.map(d => (
                  <DocRow
                    key={d.id}
                    nombre={d.nombre}
                    tipo={d.tipo}
                    estado={d.estado}
                    url={d.url}
                    fecha_vencimiento={d.fecha_vencimiento}
                    onDelete={() => {}} // managed from TrabajadorDetail
                    extra={
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Users className="h-2.5 w-2.5" />{d.trabajador_nombre}
                      </span>
                    }
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Upload dialogs */}
      <UploadDialog
        open={uploadEmpOpen}
        onClose={() => setUploadEmpOpen(false)}
        onSave={saveEmpresaDoc}
        tipos={TIPOS_EMPRESA}
        titulo="Subir documento de empresa"
        saving={savingEmp}
      />
      <UploadDialog
        open={uploadSgsstOpen}
        onClose={() => setUploadSgsstOpen(false)}
        onSave={saveSgsstDoc}
        tipos={TIPOS_SGSST}
        carpetas={carpetas}
        titulo="Subir documento SG-SST"
        saving={savingSgsst}
      />

      {/* Carpeta dialog */}
      <Dialog open={carpetaDialog} onOpenChange={setCarpetaDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Nueva carpeta</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Nombre *</Label>
              <Input value={nuevaCarpeta.nombre} onChange={e => setNuevaCarpeta(p => ({ ...p, nombre: e.target.value }))} placeholder="Ej. Procedimientos" />
            </div>
            <div className="space-y-1.5">
              <Label>Descripción</Label>
              <Input value={nuevaCarpeta.descripcion} onChange={e => setNuevaCarpeta(p => ({ ...p, descripcion: e.target.value }))} placeholder="Opcional" />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={crearCarpeta} disabled={savingCarpeta || !nuevaCarpeta.nombre.trim()}>
              {savingCarpeta ? "Creando…" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar documento?</AlertDialogTitle>
            <AlertDialogDescription>Se eliminará el archivo del almacenamiento. Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function Empty({ icon: Icon, label, onAdd, showAdd }: { icon: React.ElementType; label: string; onAdd: () => void; showAdd: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
      <Icon className="h-10 w-10 opacity-20" />
      <p className="text-sm">{label}</p>
      {showAdd && (
        <Button size="sm" variant="outline" onClick={onAdd}>
          <Plus className="h-3.5 w-3.5 mr-1.5" /> Subir primero
        </Button>
      )}
    </div>
  );
}
