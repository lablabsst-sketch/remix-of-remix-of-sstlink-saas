import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Plus, Users, Settings, Power } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { AddClienteModal } from "@/components/clientes/AddClienteModal";
import { WorkerAssignmentModal } from "@/components/clientes/WorkerAssignmentModal";

interface Cliente {
  id: string;
  nombre: string;
  nit_cedula: string;
  tipo: string;
  contacto: string | null;
  email: string | null;
  telefono: string | null;
  activo: boolean;
  notas: string | null;
  worker_count?: number;
}

export default function Clientes() {
  const { empresa } = useAuth();
  const { toast } = useToast();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editData, setEditData] = useState<Cliente | null>(null);
  const [assignModal, setAssignModal] = useState<{ id: string; nombre: string } | null>(null);

  const fetchClientes = async () => {
    if (!empresa?.id) return;
    setLoading(true);
    const { data } = await supabase
      .from("clientes_portal")
      .select("id, nombre, nit_cedula, tipo, contacto, email, telefono, activo, notas")
      .eq("empresa_id", empresa.id)
      .order("nombre");

    if (data) {
      // Get worker counts
      const { data: counts } = await supabase
        .from("trabajadores_cliente")
        .select("cliente_id")
        .eq("empresa_id", empresa.id)
        .eq("activo", true);

      const countMap: Record<string, number> = {};
      (counts ?? []).forEach(r => {
        countMap[r.cliente_id] = (countMap[r.cliente_id] ?? 0) + 1;
      });

      setClientes(data.map(c => ({ ...c, worker_count: countMap[c.id] ?? 0 })));
    }
    setLoading(false);
  };

  useEffect(() => { fetchClientes(); }, [empresa?.id]);

  const toggleActivo = async (cliente: Cliente) => {
    const { error } = await supabase
      .from("clientes_portal")
      .update({ activo: !cliente.activo })
      .eq("id", cliente.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: cliente.activo ? "Cliente desactivado" : "Cliente activado" });
      fetchClientes();
    }
  };

  return (
    <AppLayout>
      <div className="p-4 md:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Clientes</h1>
            <p className="text-sm text-muted-foreground">Gestiona los clientes que acceden al portal de trabajadores.</p>
          </div>
          <Button onClick={() => { setEditData(null); setAddOpen(true); }} size="sm">
            <Plus className="w-4 h-4 mr-1" /> Agregar Cliente
          </Button>
        </div>

        {loading ? (
          <div className="text-center text-muted-foreground py-12">Cargando…</div>
        ) : clientes.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            No hay clientes registrados. Haz clic en "Agregar Cliente" para empezar.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {clientes.map(c => (
              <Card key={c.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">{c.nombre}</h3>
                    <p className="text-xs text-muted-foreground">{c.nit_cedula}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge variant={c.tipo === "empresa" ? "default" : "secondary"} className="text-[10px]">
                      {c.tipo}
                    </Badge>
                    <Badge variant={c.activo ? "default" : "destructive"} className="text-[10px]">
                      {c.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="w-3.5 h-3.5" />
                  <span>{c.worker_count} trabajador{c.worker_count !== 1 ? "es" : ""} asignado{c.worker_count !== 1 ? "s" : ""}</span>
                </div>

                {(c.contacto || c.email || c.telefono) && (
                  <p className="text-xs text-muted-foreground truncate">
                    {[c.contacto, c.email, c.telefono].filter(Boolean).join(" · ")}
                  </p>
                )}

                <div className="flex gap-2 pt-1">
                  <Button variant="outline" size="sm" className="text-xs flex-1"
                    onClick={() => setAssignModal({ id: c.id, nombre: c.nombre })}>
                    <Settings className="w-3.5 h-3.5 mr-1" /> Gestionar trabajadores
                  </Button>
                  <Button variant="ghost" size="sm" className="text-xs"
                    onClick={() => toggleActivo(c)}>
                    <Power className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AddClienteModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSaved={fetchClientes}
        editData={editData}
      />

      {assignModal && (
        <WorkerAssignmentModal
          open={!!assignModal}
          onClose={() => setAssignModal(null)}
          clienteId={assignModal.id}
          clienteNombre={assignModal.nombre}
          onSaved={fetchClientes}
        />
      )}
    </AppLayout>
  );
}
