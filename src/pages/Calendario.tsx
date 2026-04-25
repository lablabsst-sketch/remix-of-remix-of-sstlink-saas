import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight, Plus, GraduationCap, CheckSquare, FileWarning, Layers, CalendarDays, FileText, Printer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type Vista = "mes" | "semana";
type EventTipo = "tarea" | "capacitacion" | "plan_anual" | "documento";

interface CalEvent {
  id: string;
  titulo: string;
  fecha: string; // YYYY-MM-DD
  tipo: EventTipo;
  data: Record<string, any>;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const TIPO_CONFIG: Record<EventTipo, { label: string; bg: string; text: string; icon: React.ElementType }> = {
  tarea:       { label: "Tarea",        bg: "bg-blue-100",   text: "text-blue-700",   icon: CheckSquare },
  capacitacion:{ label: "Capacitación", bg: "bg-green-100",  text: "text-green-700",  icon: GraduationCap },
  plan_anual:  { label: "Plan Anual",   bg: "bg-indigo-100", text: "text-indigo-700", icon: Layers },
  documento:   { label: "Doc. vence",   bg: "bg-red-100",    text: "text-red-700",    icon: FileWarning },
};

const DIAS   = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];
const MESES  = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const PRIORIDADES = [{ value: "baja", label: "Baja" }, { value: "media", label: "Media" }, { value: "alta", label: "Alta" }];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const toDateStr = (d: Date) => d.toISOString().slice(0, 10);

const startOfWeek = (d: Date) => {
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const s = new Date(d);
  s.setDate(d.getDate() - diff);
  return s;
};

interface UsuarioItem { id: string; nombre_completo: string; rol: string; }

const emptyTask = { titulo: "", descripcion: "", responsable: "", prioridad: "media", fecha_fin: "" };

// ─── Component ────────────────────────────────────────────────────────────────

export default function Calendario() {
  const { empresa } = useAuth();
  const { toast } = useToast();

  const [vista, setVista] = useState<Vista>("mes");
  const [current, setCurrent] = useState(new Date());
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialogs
  const [createOpen, setCreateOpen] = useState(false);
  const [createDate, setCreateDate] = useState("");
  const [taskForm, setTaskForm] = useState(emptyTask);
  const [saving, setSaving] = useState(false);
  const [usuarios, setUsuarios] = useState<UsuarioItem[]>([]);
  const [detailEvent, setDetailEvent] = useState<CalEvent | null>(null);

  // Informe
  const anioActual = new Date().getFullYear();
  const [informeOpen, setInformeOpen] = useState(false);
  const [informeAnio, setInformeAnio] = useState<"actual" | "anterior">("actual");
  const [informeMeses, setInformeMeses] = useState<number[]>([new Date().getMonth() + 1]);
  const [informeData, setInformeData] = useState<CalEvent[]>([]);
  const [informeLoading, setInformeLoading] = useState(false);
  const [informeGenerado, setInformeGenerado] = useState(false);
  const [dayOpen, setDayOpen] = useState<{ date: string; events: CalEvent[] } | null>(null);

  // ─── Fetch ─────────────────────────────────────────────────────────────────

  const fetchEvents = useCallback(async () => {
    if (!empresa?.id) return;
    setLoading(true);

    const year  = current.getFullYear();
    const month = current.getMonth() + 1;

    // Wider range to cover week view crossing month boundaries
    const rangeStart = toDateStr(new Date(year, current.getMonth() - 1, 1));
    const rangeEnd   = toDateStr(new Date(year, current.getMonth() + 2, 0));
    const today30    = toDateStr(new Date(Date.now() + 30 * 86400000));

    const [
      { data: tareas },
      { data: caps },
      { data: planActs },
      { data: docsEmp },
      { data: docsSgsst },
    ] = await Promise.all([
      (supabase as any)
        .from("tareas")
        .select("id, titulo, fecha, prioridad, estado, responsable, descripcion")
        .eq("empresa_id", empresa.id)
        .gte("fecha", rangeStart)
        .lte("fecha", rangeEnd),
      (supabase as any)
        .from("capacitaciones")
        .select("id, titulo, fecha, modalidad, estado, duracion_horas, responsable")
        .eq("empresa_id", empresa.id)
        .gte("fecha", rangeStart)
        .lte("fecha", rangeEnd),
      (supabase as any)
        .from("actividades_plan_anual")
        .select("id, actividad, meses, categoria, responsable, estado")
        .eq("empresa_id", empresa.id)
        .contains("meses", [month]),
      (supabase as any)
        .from("documentos_empresa")
        .select("id, nombre, fecha_vencimiento, tipo")
        .eq("empresa_id", empresa.id)
        .eq("tiene_vencimiento", true)
        .gte("fecha_vencimiento", toDateStr(new Date()))
        .lte("fecha_vencimiento", today30),
      (supabase as any)
        .from("documentos_sgsst")
        .select("id, nombre, fecha_vencimiento, tipo")
        .eq("empresa_id", empresa.id)
        .eq("tiene_vencimiento", true)
        .gte("fecha_vencimiento", toDateStr(new Date()))
        .lte("fecha_vencimiento", today30),
    ]);

    const all: CalEvent[] = [];

    (tareas ?? []).forEach((t: any) =>
      all.push({ id: `tarea-${t.id}`, titulo: t.titulo, fecha: t.fecha, tipo: "tarea", data: t })
    );
    (caps ?? []).forEach((c: any) =>
      all.push({ id: `cap-${c.id}`, titulo: c.titulo, fecha: c.fecha, tipo: "capacitacion", data: c })
    );
    (planActs ?? []).forEach((a: any) => {
      // Show on the 1st of each applicable month in current year
      (a.meses ?? []).forEach((m: number) => {
        if (m === month) {
          const fecha = `${year}-${String(m).padStart(2, "0")}-01`;
          all.push({ id: `plan-${a.id}-${m}`, titulo: a.actividad, fecha, tipo: "plan_anual", data: a });
        }
      });
    });
    [...(docsEmp ?? []), ...(docsSgsst ?? [])].forEach((d: any) => {
      if (d.fecha_vencimiento)
        all.push({ id: `doc-${d.id}`, titulo: d.nombre, fecha: d.fecha_vencimiento, tipo: "documento", data: d });
    });

    setEvents(all);
    setLoading(false);
  }, [empresa?.id, current]);

  useEffect(() => { if (empresa?.id) fetchEvents(); }, [empresa?.id, fetchEvents]);

  useEffect(() => {
    if (!empresa?.id) return;
    (supabase as any)
      .from("usuarios")
      .select("id,nombre_completo,rol")
      .eq("empresa_id", empresa.id)
      .in("rol", ["administrador", "asistente"])
      .then(({ data }: any) => setUsuarios(data ?? []));
  }, [empresa?.id]);

  // ─── Navigation ────────────────────────────────────────────────────────────

  const navigate = (dir: 1 | -1) => {
    const d = new Date(current);
    if (vista === "mes") d.setMonth(d.getMonth() + dir);
    else d.setDate(d.getDate() + 7 * dir);
    setCurrent(d);
  };

  const getMonthDays = () => {
    const year = current.getFullYear(), month = current.getMonth();
    const first = new Date(year, month, 1);
    const last  = new Date(year, month + 1, 0);
    const start = startOfWeek(first);
    const days: Date[] = [];
    const d = new Date(start);
    while (d <= last || days.length % 7 !== 0) {
      days.push(new Date(d));
      d.setDate(d.getDate() + 1);
      if (days.length >= 42) break;
    }
    return days;
  };

  const getWeekDays = () => {
    const s = startOfWeek(current);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(s); d.setDate(s.getDate() + i); return d;
    });
  };

  const eventsFor = (dateStr: string) => events.filter(e => e.fecha === dateStr);

  // ─── Create task ───────────────────────────────────────────────────────────

  const openCreate = (dateStr: string) => {
    setCreateDate(dateStr);
    setTaskForm(emptyTask);
    setCreateOpen(true);
  };

  const saveTask = async () => {
    if (!empresa?.id || !taskForm.titulo) return;
    setSaving(true);
    const { error } = await (supabase as any).from("tareas").insert({
      empresa_id:  empresa.id,
      titulo:      taskForm.titulo,
      descripcion: taskForm.descripcion || null,
      responsable: taskForm.responsable || null,
      prioridad:   taskForm.prioridad,
      fecha:       createDate,
      fecha_fin:   taskForm.fecha_fin || null,
      estado:      "pendiente",
    });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Tarea creada" }); setCreateOpen(false); fetchEvents(); }
    setSaving(false);
  };

  // ─── Informe ───────────────────────────────────────────────────────────────

  const toggleInformeMes = (m: number) => {
    setInformeMeses(prev =>
      prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m].sort((a, b) => a - b)
    );
  };

  const generarInforme = async () => {
    if (!empresa?.id) return;
    setInformeLoading(true);
    setInformeGenerado(false);

    const anio = informeAnio === "actual" ? anioActual : anioActual - 1;
    const meses = informeAnio === "anterior"
      ? [1,2,3,4,5,6,7,8,9,10,11,12]
      : informeMeses.length > 0 ? informeMeses : [1,2,3,4,5,6,7,8,9,10,11,12];

    const rangeStart = `${anio}-${String(Math.min(...meses)).padStart(2,"0")}-01`;
    const lastMes = Math.max(...meses);
    const rangeEnd = toDateStr(new Date(anio, lastMes, 0)); // last day of last month

    const [
      { data: tareas },
      { data: caps },
      { data: planActs },
    ] = await Promise.all([
      (supabase as any)
        .from("tareas")
        .select("id,titulo,fecha,prioridad,estado,responsable,descripcion")
        .eq("empresa_id", empresa.id)
        .gte("fecha", rangeStart)
        .lte("fecha", rangeEnd)
        .order("fecha"),
      (supabase as any)
        .from("capacitaciones")
        .select("id,titulo,fecha,modalidad,estado,duracion_horas,responsable,descripcion")
        .eq("empresa_id", empresa.id)
        .gte("fecha", rangeStart)
        .lte("fecha", rangeEnd)
        .order("fecha"),
      (supabase as any)
        .from("actividades_plan_anual")
        .select("id,actividad,meses,categoria,responsable,estado,observaciones")
        .eq("empresa_id", empresa.id),
    ]);

    const all: CalEvent[] = [];
    (tareas ?? []).forEach((t: any) =>
      all.push({ id: `tarea-${t.id}`, titulo: t.titulo, fecha: t.fecha, tipo: "tarea", data: t })
    );
    (caps ?? []).forEach((c: any) =>
      all.push({ id: `cap-${c.id}`, titulo: c.titulo, fecha: c.fecha, tipo: "capacitacion", data: c })
    );
    (planActs ?? []).forEach((a: any) => {
      const mesesAct: number[] = a.meses ?? [];
      const coincide = mesesAct.filter(m => meses.includes(m));
      coincide.forEach(m => {
        const fecha = `${anio}-${String(m).padStart(2,"0")}-01`;
        all.push({ id: `plan-${a.id}-${m}`, titulo: a.actividad, fecha, tipo: "plan_anual", data: a });
      });
    });

    all.sort((a, b) => a.fecha.localeCompare(b.fecha));
    setInformeData(all);
    setInformeLoading(false);
    setInformeGenerado(true);
  };

  // ─── Render helpers ────────────────────────────────────────────────────────

  const today = toDateStr(new Date());
  const weekDays = getWeekDays();
  const title = vista === "mes"
    ? `${MESES[current.getMonth()]} ${current.getFullYear()}`
    : `${weekDays[0].getDate()} – ${weekDays[6].getDate()} ${MESES[weekDays[6].getMonth()]} ${weekDays[6].getFullYear()}`;

  const EventChip = ({ evt, onClick }: { evt: CalEvent; onClick: () => void }) => {
    const cfg = TIPO_CONFIG[evt.tipo];
    return (
      <div
        className={cn("text-[10px] px-1.5 py-0.5 rounded truncate font-medium cursor-pointer hover:opacity-80 flex items-center gap-1", cfg.bg, cfg.text)}
        onClick={e => { e.stopPropagation(); onClick(); }}
      >
        <cfg.icon className="h-2.5 w-2.5 flex-shrink-0" />
        <span className="truncate">{evt.titulo}</span>
      </div>
    );
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <AppLayout breadcrumbs={["SSTLink", "Calendario"]}>
      <div className="space-y-4 max-w-6xl">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-indigo-500" />
              Calendario SST
            </h1>
            <p className="text-sm text-muted-foreground">Plan anual · Capacitaciones · Tareas · Documentos por vencer</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setInformeGenerado(false); setInformeOpen(true); }}
            >
              <FileText className="h-4 w-4 mr-1.5" /> Informe
            </Button>
            <div className="flex rounded-lg border overflow-hidden text-xs font-medium">
              {(["mes", "semana"] as Vista[]).map(v => (
                <button
                  key={v}
                  className={cn("px-4 py-2 capitalize transition-colors", vista === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}
                  onClick={() => setVista(v)}
                >{v}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(TIPO_CONFIG).map(([tipo, cfg]) => (
            <span key={tipo} className={cn("flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full font-medium", cfg.bg, cfg.text)}>
              <cfg.icon className="h-3 w-3" />{cfg.label}
            </span>
          ))}
        </div>

        {/* Nav */}
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-muted transition-colors"><ChevronLeft className="h-4 w-4" /></button>
          <button onClick={() => navigate(1)}  className="p-1.5 rounded-lg hover:bg-muted transition-colors"><ChevronRight className="h-4 w-4" /></button>
          <span className="text-base font-semibold min-w-[220px]">{title}</span>
          <button onClick={() => setCurrent(new Date())} className="px-2.5 py-1 text-xs rounded-lg border hover:bg-muted transition-colors">Hoy</button>
        </div>

        {/* ── Month View ── */}
        {vista === "mes" && (
          <div className="rounded-xl border overflow-hidden bg-background">
            <div className="grid grid-cols-7 bg-muted/50 border-b">
              {DIAS.map(d => <div key={d} className="py-2 text-center text-[11px] font-medium text-muted-foreground">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 divide-x divide-y">
              {getMonthDays().map((day, i) => {
                const ds = toDateStr(day);
                const isCurrent = day.getMonth() === current.getMonth();
                const isToday   = ds === today;
                const dayEvts   = eventsFor(ds);
                const visible   = dayEvts.slice(0, 3);
                const extra     = dayEvts.length - 3;
                return (
                  <div
                    key={i}
                    className={cn("min-h-[96px] p-1.5 cursor-pointer hover:bg-muted/20 transition-colors group", !isCurrent && "bg-muted/5")}
                    onClick={() => openCreate(ds)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={cn(
                        "text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full",
                        isToday ? "bg-primary text-primary-foreground" : isCurrent ? "text-foreground" : "text-muted-foreground/30"
                      )}>
                        {day.getDate()}
                      </span>
                      <Plus className="h-3 w-3 text-muted-foreground/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="space-y-0.5">
                      {visible.map(evt => (
                        <EventChip key={evt.id} evt={evt} onClick={() => setDetailEvent(evt)} />
                      ))}
                      {extra > 0 && (
                        <button
                          className="text-[10px] text-muted-foreground hover:underline pl-1"
                          onClick={e => { e.stopPropagation(); setDayOpen({ date: ds, events: dayEvts }); }}
                        >+{extra} más</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Week View ── */}
        {vista === "semana" && (
          <div className="rounded-xl border overflow-hidden bg-background">
            <div className="grid grid-cols-7 divide-x">
              {weekDays.map((day, i) => {
                const ds      = toDateStr(day);
                const isToday = ds === today;
                const dayEvts = eventsFor(ds);
                return (
                  <div key={i} className="min-h-[320px] flex flex-col">
                    {/* Header */}
                    <div
                      className={cn("py-3 text-center border-b cursor-pointer hover:bg-muted/20 transition-colors", isToday && "bg-primary/5")}
                      onClick={() => openCreate(ds)}
                    >
                      <p className="text-[11px] text-muted-foreground">{DIAS[i]}</p>
                      <p className={cn(
                        "text-lg font-semibold mt-0.5 w-9 h-9 mx-auto flex items-center justify-center rounded-full",
                        isToday && "bg-primary text-primary-foreground"
                      )}>{day.getDate()}</p>
                    </div>
                    {/* Events */}
                    <div className="flex-1 p-1.5 space-y-1">
                      {dayEvts.map(evt => (
                        <EventChip key={evt.id} evt={evt} onClick={() => setDetailEvent(evt)} />
                      ))}
                      <button
                        className="w-full mt-1 py-1.5 text-[10px] text-muted-foreground/40 border border-dashed border-muted-foreground/20 rounded hover:border-muted-foreground/40 hover:text-muted-foreground/60 transition-colors flex items-center justify-center"
                        onClick={() => openCreate(ds)}
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Create Task Dialog ── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva tarea — {createDate}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <Label>Título *</Label>
              <Input value={taskForm.titulo} onChange={e => setTaskForm({ ...taskForm, titulo: e.target.value })} placeholder="¿Qué hay que hacer?" autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label>Descripción</Label>
              <Textarea value={taskForm.descripcion} onChange={e => setTaskForm({ ...taskForm, descripcion: e.target.value })} rows={2} placeholder="Detalle opcional…" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Responsable</Label>
                <Select value={taskForm.responsable} onValueChange={v => setTaskForm({ ...taskForm, responsable: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                  <SelectContent>
                    {usuarios.length === 0
                      ? <SelectItem value="__none" disabled>Sin usuarios disponibles</SelectItem>
                      : usuarios.map(u => (
                          <SelectItem key={u.id} value={u.nombre_completo}>
                            {u.nombre_completo}
                            <span className="ml-2 text-[10px] text-muted-foreground">{u.rol}</span>
                          </SelectItem>
                        ))
                    }
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Prioridad</Label>
                <Select value={taskForm.prioridad} onValueChange={v => setTaskForm({ ...taskForm, prioridad: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PRIORIDADES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Fecha límite</Label>
              <Input type="date" value={taskForm.fecha_fin} onChange={e => setTaskForm({ ...taskForm, fecha_fin: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline" size="sm">Cancelar</Button></DialogClose>
            <Button size="sm" onClick={saveTask} disabled={saving || !taskForm.titulo}>
              {saving ? "Guardando…" : "Crear tarea"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Day Events Dialog ── */}
      <Dialog open={!!dayOpen} onOpenChange={() => setDayOpen(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Eventos — {dayOpen?.date}</DialogTitle></DialogHeader>
          <div className="space-y-1.5 max-h-72 overflow-y-auto">
            {dayOpen?.events.map(evt => {
              const cfg = TIPO_CONFIG[evt.tipo];
              return (
                <div
                  key={evt.id}
                  className={cn("px-3 py-2 rounded-lg cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-2", cfg.bg, cfg.text)}
                  onClick={() => { setDayOpen(null); setDetailEvent(evt); }}
                >
                  <cfg.icon className="h-3.5 w-3.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{evt.titulo}</p>
                    <p className="text-[10px] opacity-70">{cfg.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <DialogFooter>
            <Button size="sm" onClick={() => { const d = dayOpen?.date ?? ""; setDayOpen(null); openCreate(d); }}>
              <Plus className="h-3.5 w-3.5 mr-1" />Nueva tarea
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Event Detail Dialog ── */}
      <Dialog open={!!detailEvent} onOpenChange={() => setDetailEvent(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {detailEvent && (() => {
                const cfg = TIPO_CONFIG[detailEvent.tipo];
                return (
                  <span className={cn("text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5 w-fit", cfg.bg, cfg.text)}>
                    <cfg.icon className="h-3.5 w-3.5" />{cfg.label}
                  </span>
                );
              })()}
            </DialogTitle>
          </DialogHeader>
          {detailEvent && (
            <div className="space-y-2 text-sm">
              <p className="font-semibold text-base leading-snug">{detailEvent.titulo}</p>
              <p className="text-muted-foreground text-xs">📅 {detailEvent.fecha}</p>
              {detailEvent.tipo === "tarea" && <>
                {detailEvent.data.descripcion && <p className="text-muted-foreground">{detailEvent.data.descripcion}</p>}
                {detailEvent.data.responsable && <p><span className="font-medium">Responsable:</span> {detailEvent.data.responsable}</p>}
                <p><span className="font-medium">Prioridad:</span> {detailEvent.data.prioridad} · <span className="font-medium">Estado:</span> {detailEvent.data.estado}</p>
              </>}
              {detailEvent.tipo === "capacitacion" && <>
                {detailEvent.data.responsable && <p><span className="font-medium">Instructor:</span> {detailEvent.data.responsable}</p>}
                <p><span className="font-medium">Modalidad:</span> {detailEvent.data.modalidad} · <span className="font-medium">Estado:</span> {detailEvent.data.estado}</p>
                {detailEvent.data.duracion_horas && <p><span className="font-medium">Duración:</span> {detailEvent.data.duracion_horas}h</p>}
              </>}
              {detailEvent.tipo === "plan_anual" && <>
                {detailEvent.data.categoria && <p><span className="font-medium">Categoría:</span> {detailEvent.data.categoria}</p>}
                {detailEvent.data.responsable && <p><span className="font-medium">Responsable:</span> {detailEvent.data.responsable}</p>}
                <p><span className="font-medium">Estado:</span> {detailEvent.data.estado}</p>
              </>}
              {detailEvent.tipo === "documento" && <>
                <p className="text-red-600 font-medium">⚠️ Vence el {detailEvent.fecha}</p>
                {detailEvent.data.tipo && <p><span className="font-medium">Tipo:</span> {detailEvent.data.tipo}</p>}
              </>}
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild><Button variant="outline" size="sm">Cerrar</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Informe Dialog ── */}
      <Dialog open={informeOpen} onOpenChange={setInformeOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4" /> Informe de Actividades SST
            </DialogTitle>
          </DialogHeader>

          {/* Filtros */}
          <div className="space-y-4 border-b pb-4 print:hidden">
            {/* Año */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium w-20">Período:</span>
              <div className="flex rounded-lg border overflow-hidden text-xs font-medium">
                {([
                  { value: "actual", label: `Año actual (${anioActual})` },
                  { value: "anterior", label: `Año anterior (${anioActual - 1})` },
                ] as const).map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { setInformeAnio(opt.value); setInformeGenerado(false); }}
                    className={cn("px-4 py-2 transition-colors", informeAnio === opt.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}
                  >{opt.label}</button>
                ))}
              </div>
            </div>

            {/* Meses (solo año actual) */}
            {informeAnio === "actual" && (
              <div className="flex items-start gap-3">
                <span className="text-sm font-medium w-20 pt-1">Meses:</span>
                <div className="flex flex-wrap gap-1.5">
                  {MESES.map((m, i) => {
                    const mes = i + 1;
                    const active = informeMeses.includes(mes);
                    return (
                      <button
                        key={mes}
                        type="button"
                        onClick={() => { toggleInformeMes(mes); setInformeGenerado(false); }}
                        className={cn(
                          "px-2.5 py-1 rounded-md text-xs font-medium border transition-colors",
                          active
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background text-muted-foreground border-border hover:border-primary/50"
                        )}
                      >
                        {m.slice(0, 3)}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => { setInformeMeses([1,2,3,4,5,6,7,8,9,10,11,12]); setInformeGenerado(false); }}
                    className="px-2.5 py-1 rounded-md text-xs font-medium border border-dashed text-muted-foreground hover:border-primary/50 transition-colors"
                  >Todo el año</button>
                </div>
              </div>
            )}

            <Button size="sm" onClick={generarInforme} disabled={informeLoading}>
              {informeLoading ? "Generando..." : "Generar informe"}
            </Button>
          </div>

          {/* Tabla */}
          {informeGenerado && (
            <div className="flex-1 overflow-auto">
              {/* Print header */}
              <div className="hidden print:block mb-4">
                <h2 className="text-lg font-bold">Informe de Actividades SST</h2>
                <p className="text-sm text-muted-foreground">
                  {informeAnio === "anterior"
                    ? `Año ${anioActual - 1} — Consolidado`
                    : `Año ${anioActual} — ${informeMeses.length === 12 ? "Todos los meses" : informeMeses.map(m => MESES[m-1]).join(", ")}`
                  }
                </p>
              </div>

              {informeData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                  <FileText className="h-8 w-8 opacity-30" />
                  <p className="text-sm">Sin registros para el período seleccionado</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-3 print:hidden">
                    <span className="text-sm text-muted-foreground">{informeData.length} registros</span>
                    <Button size="sm" variant="outline" onClick={() => window.print()}>
                      <Printer className="h-3.5 w-3.5 mr-1.5" /> Imprimir
                    </Button>
                  </div>
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b bg-muted/40">
                        <th className="text-left py-2 px-2 text-[11px] font-semibold text-muted-foreground w-[90px]">Fecha</th>
                        <th className="text-left py-2 px-2 text-[11px] font-semibold text-muted-foreground w-[100px]">Tipo</th>
                        <th className="text-left py-2 px-2 text-[11px] font-semibold text-muted-foreground">Título / Actividad</th>
                        <th className="text-left py-2 px-2 text-[11px] font-semibold text-muted-foreground">Descripción</th>
                        <th className="text-left py-2 px-2 text-[11px] font-semibold text-muted-foreground w-[120px]">Responsable</th>
                        <th className="text-left py-2 px-2 text-[11px] font-semibold text-muted-foreground w-[90px]">Estado</th>
                        <th className="text-left py-2 px-2 text-[11px] font-semibold text-muted-foreground w-[80px]">Prioridad</th>
                      </tr>
                    </thead>
                    <tbody>
                      {informeData.map(evt => {
                        const cfg = TIPO_CONFIG[evt.tipo];
                        const d = evt.data;
                        return (
                          <tr key={evt.id} className="border-b hover:bg-muted/20 transition-colors">
                            <td className="py-2 px-2 text-[11px] text-muted-foreground whitespace-nowrap">
                              {new Date(evt.fecha + "T00:00:00").toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })}
                            </td>
                            <td className="py-2 px-2">
                              <span className={cn("inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-medium", cfg.bg, cfg.text)}>
                                <cfg.icon className="h-2.5 w-2.5" />{cfg.label}
                              </span>
                            </td>
                            <td className="py-2 px-2 text-[12px] font-medium max-w-[200px]">
                              <span className="line-clamp-2">{evt.titulo}</span>
                            </td>
                            <td className="py-2 px-2 text-[11px] text-muted-foreground max-w-[180px]">
                              <span className="line-clamp-2">
                                {evt.tipo === "tarea" && d.descripcion}
                                {evt.tipo === "capacitacion" && [d.modalidad, d.duracion_horas ? `${d.duracion_horas}h` : null].filter(Boolean).join(" · ")}
                                {evt.tipo === "plan_anual" && d.categoria}
                              </span>
                            </td>
                            <td className="py-2 px-2 text-[11px] text-muted-foreground">
                              {d.responsable || "—"}
                            </td>
                            <td className="py-2 px-2">
                              {d.estado && (
                                <Badge variant="outline" className="text-[9px] h-4 px-1">
                                  {d.estado}
                                </Badge>
                              )}
                            </td>
                            <td className="py-2 px-2">
                              {evt.tipo === "tarea" && d.prioridad && (
                                <Badge variant="outline" className={cn("text-[9px] h-4 px-1",
                                  d.prioridad === "alta" ? "bg-red-50 text-red-600 border-red-200" :
                                  d.prioridad === "media" ? "bg-yellow-50 text-yellow-600 border-yellow-200" :
                                  "bg-green-50 text-green-600 border-green-200"
                                )}>
                                  {d.prioridad}
                                </Badge>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </>
              )}
            </div>
          )}

          <DialogFooter className="print:hidden">
            <DialogClose asChild><Button variant="outline" size="sm">Cerrar</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
