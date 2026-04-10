import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Pencil, User, Briefcase, Heart, FileText } from "lucide-react";
import { AddWorkerModal } from "@/components/trabajadores/AddWorkerModal";
import { DocumentosTrabajador } from "@/components/trabajadores/DocumentosTrabajador";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const estadoColor: Record<string, string> = {
  aprobado: "bg-emerald-100 text-emerald-700 border-emerald-200",
  activo:   "bg-emerald-100 text-emerald-700 border-emerald-200",
  pendiente:"bg-amber-100 text-amber-700 border-amber-200",
  inactivo: "bg-slate-100 text-slate-600 border-slate-200",
  retirado: "bg-red-100 text-red-700 border-red-200",
};

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="py-2.5 border-b last:border-0">
      <p className="text-[11px] text-muted-foreground mb-0.5">{label}</p>
      <p className="text-xs font-medium text-foreground">{value || <span className="text-muted-foreground/50 font-normal">—</span>}</p>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1 mt-4 first:mt-0">{children}</p>;
}

export default function TrabajadorDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { empresa } = useAuth();
  const [worker, setWorker] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  const fetchWorker = async () => {
    if (!id) return;
    const { data } = await supabase.from("trabajadores").select("*").eq("id", id).single();
    setWorker(data);
    setLoading(false);
  };

  useEffect(() => { fetchWorker(); }, [id]);

  const initials = worker ? `${worker.nombres?.[0] || ""}${worker.apellidos?.[0] || ""}`.toUpperCase() : "?";
  const fullName = worker ? `${worker.nombres} ${worker.apellidos}` : "";
  const edad = worker?.fecha_nacimiento
    ? Math.floor((Date.now() - new Date(worker.fecha_nacimiento).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  const fmt = (date?: string | null) => date ? format(new Date(date + "T00:00:00"), "dd MMM yyyy", { locale: es }) : null;

  if (loading) return (
    <AppLayout>
      <div className="p-6 space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="flex gap-4 items-center">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2"><Skeleton className="h-5 w-48" /><Skeleton className="h-4 w-32" /></div>
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    </AppLayout>
  );

  if (!worker) return (
    <AppLayout>
      <div className="p-6 text-center text-muted-foreground">
        <p className="text-sm">Trabajador no encontrado.</p>
        <Button variant="link" onClick={() => navigate("/trabajadores")} className="text-xs mt-2">Volver a la lista</Button>
      </div>
    </AppLayout>
  );

  return (
    <AppLayout>
      <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-5">

        {/* Breadcrumb */}
        <button onClick={() => navigate("/trabajadores")} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Trabajadores
        </button>

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14 text-base">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-base font-semibold leading-tight">{fullName}</h1>
              <p className="text-xs text-muted-foreground mt-0.5">{worker.cargo || "Sin cargo"} · {worker.tipo_documento} {worker.numero_documento}</p>
              <div className="flex gap-2 mt-1.5">
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${estadoColor[worker.estado] || estadoColor.pendiente}`}>
                  {worker.estado?.charAt(0).toUpperCase() + worker.estado?.slice(1)}
                </span>
                {worker.tipo_trabajador && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full border bg-blue-50 text-blue-700 border-blue-200 font-medium capitalize">
                    {worker.tipo_trabajador}
                  </span>
                )}
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)} className="text-xs h-8 gap-1.5 shrink-0">
            <Pencil className="w-3.5 h-3.5" /> Editar
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid grid-cols-4 h-8 w-full">
            <TabsTrigger value="personal" className="text-[11px] gap-1"><User className="w-3 h-3" />Personal</TabsTrigger>
            <TabsTrigger value="laboral" className="text-[11px] gap-1"><Briefcase className="w-3 h-3" />Laboral</TabsTrigger>
            <TabsTrigger value="afiliaciones" className="text-[11px] gap-1"><Heart className="w-3 h-3" />Afiliaciones</TabsTrigger>
            <TabsTrigger value="documentos" className="text-[11px] gap-1"><FileText className="w-3 h-3" />Documentos</TabsTrigger>
          </TabsList>

          {/* TAB 1 — PERSONAL */}
          <TabsContent value="personal" className="mt-4">
            <div className="rounded-lg border bg-card p-4">
              <SectionTitle>Datos personales</SectionTitle>
              <div className="grid grid-cols-2 gap-x-8">
                <InfoRow label="Nombres" value={worker.nombres} />
                <InfoRow label="Apellidos" value={worker.apellidos} />
                <InfoRow label="Tipo documento" value={worker.tipo_documento} />
                <InfoRow label="Número documento" value={worker.numero_documento} />
                <InfoRow label="Fecha de nacimiento" value={fmt(worker.fecha_nacimiento)} />
                <InfoRow label="Edad" value={edad ? `${edad} años` : null} />
                <InfoRow label="Género" value={worker.genero ? worker.genero.charAt(0).toUpperCase() + worker.genero.slice(1).replace("_", " ") : null} />
                <InfoRow label="Grupo RH" value={worker.rh} />
              </div>

              <SectionTitle>Ubicación</SectionTitle>
              <div className="grid grid-cols-2 gap-x-8">
                <InfoRow label="País" value={worker.pais} />
                <InfoRow label="Departamento" value={worker.departamento} />
                <InfoRow label="Ciudad de nacimiento" value={worker.ciudad} />
                <InfoRow label="Ciudad de residencia" value={worker.ciudad_residencia} />
                <InfoRow label="Dirección" value={worker.direccion} />
              </div>

              <SectionTitle>Contacto</SectionTitle>
              <div className="grid grid-cols-2 gap-x-8">
                <InfoRow label="Email" value={worker.email} />
                <InfoRow label="Teléfono" value={worker.telefono} />
              </div>

              <SectionTitle>Contacto de emergencia</SectionTitle>
              <div className="grid grid-cols-3 gap-x-8">
                <InfoRow label="Nombre" value={worker.nombre_contacto_emergencia} />
                <InfoRow label="Celular" value={worker.celular_contacto_emergencia} />
                <InfoRow label="Parentesco" value={worker.parentesco_contacto_emergencia} />
              </div>
            </div>
          </TabsContent>

          {/* TAB 2 — LABORAL */}
          <TabsContent value="laboral" className="mt-4">
            <div className="rounded-lg border bg-card p-4">
              <SectionTitle>Información laboral</SectionTitle>
              <div className="grid grid-cols-2 gap-x-8">
                <InfoRow label="Cargo" value={worker.cargo} />
                <InfoRow label="Sede" value={worker.sede} />
                <InfoRow label="Tipo de trabajador" value={worker.tipo_trabajador ? worker.tipo_trabajador.charAt(0).toUpperCase() + worker.tipo_trabajador.slice(1) : null} />
                <InfoRow label="Empresa contratista" value={worker.empresa_contratista} />
              </div>

              <SectionTitle>Contrato</SectionTitle>
              <div className="grid grid-cols-2 gap-x-8">
                <InfoRow label="Tipo de contrato" value={
                  worker.tipo_contrato === "indefinido" ? "Indefinido" :
                  worker.tipo_contrato === "fijo" ? "Término fijo" :
                  worker.tipo_contrato === "obra" ? "Obra o labor" :
                  worker.tipo_contrato === "aprendiz" ? "Aprendiz" :
                  worker.tipo_contrato === "prestacion" ? "Prestación de servicios" : worker.tipo_contrato
                } />
                <InfoRow label="Estado" value={worker.estado?.charAt(0).toUpperCase() + worker.estado?.slice(1)} />
                <InfoRow label="Fecha de ingreso" value={fmt(worker.fecha_ingreso)} />
                <InfoRow label="Fecha fin contrato" value={fmt(worker.fecha_fin_contrato)} />
              </div>

              {/* Alerta contrato próximo a vencer */}
              {worker.fecha_fin_contrato && (() => {
                const dias = Math.ceil((new Date(worker.fecha_fin_contrato).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                if (dias > 0 && dias <= 30) return (
                  <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 p-3">
                    <p className="text-xs text-amber-700 font-medium">⚠️ Contrato vence en {dias} días ({fmt(worker.fecha_fin_contrato)})</p>
                  </div>
                );
                if (dias <= 0) return (
                  <div className="mt-3 rounded-lg bg-red-50 border border-red-200 p-3">
                    <p className="text-xs text-red-700 font-medium">🔴 Contrato vencido desde {fmt(worker.fecha_fin_contrato)}</p>
                  </div>
                );
                return null;
              })()}
            </div>
          </TabsContent>

          {/* TAB 3 — AFILIACIONES */}
          <TabsContent value="afiliaciones" className="mt-4">
            <div className="rounded-lg border bg-card p-4">
              <SectionTitle>Seguridad social</SectionTitle>
              <div className="grid grid-cols-2 gap-x-8">
                <InfoRow label="ARL" value={worker.arl} />
                <InfoRow label="EPS" value={worker.eps} />
                <InfoRow label="Pensión" value={worker.pension} />
                <InfoRow label="Caja de compensación" value={worker.caja_compensacion} />
              </div>

              <div className="mt-4 rounded-lg bg-muted/40 border p-3">
                <p className="text-[11px] text-muted-foreground">
                  📎 Los documentos de afiliación (planillas, certificados ARL, carné EPS) se gestionan en la pestaña <strong>Documentos</strong>.
                </p>
              </div>
            </div>
          </TabsContent>

          {/* TAB 4 — DOCUMENTOS */}
          <TabsContent value="documentos" className="mt-4">
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-semibold">Documentos del trabajador</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Sube PDF o imágenes — máx. 10MB por archivo</p>
                </div>
              </div>
              <DocumentosTrabajador trabajadorId={worker.id} trabajadorNombre={fullName} />
            </div>
          </TabsContent>
        </Tabs>

        {/* Modal editar */}
        <AddWorkerModal
          open={editOpen}
          onOpenChange={setEditOpen}
          empresaId={empresa?.id ?? null}
          onSuccess={(updated) => { if (updated) setWorker(updated); }}
          editWorker={worker}
        />
      </div>
    </AppLayout>
  );
}
