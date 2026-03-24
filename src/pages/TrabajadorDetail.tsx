import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, User, FileText, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface Trabajador {
  id: string;
  nombres: string;
  apellidos: string;
  tipo_documento: string;
  numero_documento: string;
  cargo: string | null;
  email: string | null;
  estado: string;
  fecha_ingreso: string;
}

export default function TrabajadorDetail() {
  const { id } = useParams<{ id: string }>();
  const [worker, setWorker] = useState<Trabajador | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    supabase
      .from("trabajadores")
      .select("id, nombres, apellidos, tipo_documento, numero_documento, cargo, email, estado, fecha_ingreso")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => {
        setWorker(data);
        setLoading(false);
      });
  }, [id]);

  const initials = worker ? ((worker.nombres[0] || "") + (worker.apellidos[0] || "")).toUpperCase() : "";

  return (
    <AppLayout breadcrumbs={["SSTLink", "Trabajadores", worker?.nombres ?? "Detalle"]}>
      <div className="max-w-4xl space-y-4">
        {/* Back */}
        <Link to="/trabajadores" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          Volver a trabajadores
        </Link>

        {/* Header */}
        {loading ? (
          <div className="flex items-center gap-4">
            <Skeleton className="w-14 h-14 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        ) : worker ? (
          <div className="flex items-center gap-4">
            <Avatar className="w-14 h-14">
              <AvatarFallback className="bg-accent text-accent-foreground text-sm font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-medium text-foreground">{worker.nombres} {worker.apellidos}</h1>
                <Badge
                  className={cn(
                    "text-[10px] px-2 py-0.5 font-medium border-0",
                    worker.estado === "aprobado"
                      ? "bg-secondary/10 text-secondary"
                      : worker.estado === "inactivo"
                      ? "bg-muted text-muted-foreground"
                      : "bg-primary/10 text-primary"
                  )}
                >
                  {worker.estado.charAt(0).toUpperCase() + worker.estado.slice(1)}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{worker.cargo || "Sin cargo"} · {worker.tipo_documento} {worker.numero_documento}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Trabajador no encontrado.</p>
        )}

        {/* Tabs */}
        {worker && (
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="bg-background border-[0.5px] border-border rounded-lg h-9">
              <TabsTrigger value="personal" className="text-xs gap-1.5 data-[state=active]:bg-card">
                <User className="w-3.5 h-3.5" aria-hidden="true" />
                Datos Personales
              </TabsTrigger>
              <TabsTrigger value="contrato" className="text-xs gap-1.5 data-[state=active]:bg-card">
                <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                Contrato & Emergencia
              </TabsTrigger>
              <TabsTrigger value="afiliaciones" className="text-xs gap-1.5 data-[state=active]:bg-card">
                <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                Afiliaciones
              </TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="mt-4">
              <div className="bg-card rounded-xl border-[0.5px] border-border p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InfoField label="Nombres" value={worker.nombres} />
                  <InfoField label="Apellidos" value={worker.apellidos} />
                  <InfoField label="Tipo Documento" value={worker.tipo_documento} />
                  <InfoField label="Número Documento" value={worker.numero_documento} />
                  <InfoField label="Cargo" value={worker.cargo || "—"} />
                  <InfoField label="Email" value={worker.email || "—"} />
                  <InfoField label="Fecha Ingreso" value={new Date(worker.fecha_ingreso + "T00:00:00").toLocaleDateString("es-CO", { month: "long", day: "numeric", year: "numeric" })} />
                  <InfoField label="Estado" value={worker.estado.charAt(0).toUpperCase() + worker.estado.slice(1)} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="contrato" className="mt-4">
              <PlaceholderTab icon={<FileText className="w-5 h-5 text-primary" />} text="Contrato & Emergencia" />
            </TabsContent>

            <TabsContent value="afiliaciones" className="mt-4">
              <PlaceholderTab icon={<ShieldCheck className="w-5 h-5 text-primary" />} text="Afiliaciones" />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AppLayout>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-xs text-foreground font-medium">{value}</p>
    </div>
  );
}

function PlaceholderTab({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="bg-card rounded-xl border-[0.5px] border-border p-10 flex flex-col items-center text-center">
      <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mb-3">
        {icon}
      </div>
      <p className="text-sm font-medium text-foreground mb-1">{text}</p>
      <p className="text-xs text-muted-foreground">Próximamente — esta sección se habilitará en la siguiente versión.</p>
    </div>
  );
}
