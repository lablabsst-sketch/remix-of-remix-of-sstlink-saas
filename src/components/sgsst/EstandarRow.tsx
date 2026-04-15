import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Upload, Download, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface DocEstandar {
  id: string;
  doc_url: string | null;
  doc_nombre: string | null;
  doc_subido_en: string | null;
  plantilla_url: string | null;
  plantilla_nombre: string | null;
  plantilla_subido_en: string | null;
  estado: string;
}

interface Props {
  estandar: { id: string; codigo: string; nombre: string };
  empresaId: string;
  doc: DocEstandar | null;
  onUpdate: () => void;
}

const estadoConfig: Record<string, { label: string; className: string }> = {
  sin_iniciar: { label: "Sin iniciar", className: "bg-muted text-muted-foreground" },
  en_progreso: { label: "En progreso", className: "bg-amber-50 text-amber-700 border-amber-200" },
  completado: { label: "Completado", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

function computeEstado(hasDoc: boolean, hasPlantilla: boolean) {
  if (hasDoc && hasPlantilla) return "completado";
  if (hasDoc || hasPlantilla) return "en_progreso";
  return "sin_iniciar";
}

export function EstandarRow({ estandar, empresaId, doc, onUpdate }: Props) {
  const [uploading, setUploading] = useState<"doc" | "plantilla" | null>(null);
  const docRef = useRef<HTMLInputElement>(null);
  const plantillaRef = useRef<HTMLInputElement>(null);

  const estado = doc?.estado ?? "sin_iniciar";
  const config = estadoConfig[estado] ?? estadoConfig.sin_iniciar;

  const handleUpload = async (type: "doc" | "plantilla", file: File) => {
    setUploading(type);
    try {
      const ext = file.name.split(".").pop();
      const path = `${empresaId}/sgsst/${estandar.codigo}/${type}_${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("documentos").upload(path, file);
      if (uploadErr) throw uploadErr;

      const { data: { publicUrl } } = supabase.storage.from("documentos").getPublicUrl(path);

      const hasDoc = type === "doc" ? true : !!doc?.doc_url;
      const hasPlantilla = type === "plantilla" ? true : !!doc?.plantilla_url;
      const newEstado = computeEstado(hasDoc, hasPlantilla);

      const upsertData: Record<string, unknown> = {
        empresa_id: empresaId,
        estandar_id: estandar.id,
        estado: newEstado,
      };

      if (type === "doc") {
        upsertData.doc_url = publicUrl;
        upsertData.doc_nombre = file.name;
        upsertData.doc_subido_en = new Date().toISOString();
      } else {
        upsertData.plantilla_url = publicUrl;
        upsertData.plantilla_nombre = file.name;
        upsertData.plantilla_subido_en = new Date().toISOString();
      }

      const { error } = await supabase
        .from("docs_estandar")
        .upsert(upsertData as any, { onConflict: "empresa_id,estandar_id" });

      if (error) throw error;
      toast.success(`${type === "doc" ? "Documento" : "Plantilla"} subido`);
      onUpdate();
    } catch (err: any) {
      toast.error(err.message || "Error al subir archivo");
    } finally {
      setUploading(null);
    }
  };

  const handleDelete = async (type: "doc" | "plantilla") => {
    try {
      const updateData: Record<string, unknown> = {};
      if (type === "doc") {
        updateData.doc_url = null;
        updateData.doc_nombre = null;
        updateData.doc_subido_en = null;
      } else {
        updateData.plantilla_url = null;
        updateData.plantilla_nombre = null;
        updateData.plantilla_subido_en = null;
      }

      const hasDoc = type === "doc" ? false : !!doc?.doc_url;
      const hasPlantilla = type === "plantilla" ? false : !!doc?.plantilla_url;
      updateData.estado = computeEstado(hasDoc, hasPlantilla);

      const { error } = await supabase
        .from("docs_estandar")
        .update(updateData as any)
        .eq("empresa_id", empresaId)
        .eq("estandar_id", estandar.id);

      if (error) throw error;
      toast.success("Archivo eliminado");
      onUpdate();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 py-2.5 border-b last:border-0">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <Badge variant="outline" className="text-[10px] h-5 shrink-0 font-mono">{estandar.codigo}</Badge>
        <span className="text-[12px] text-foreground truncate">{estandar.nombre}</span>
      </div>

      <div className="flex items-center gap-2 shrink-0 flex-wrap">
        <Badge variant="outline" className={`text-[10px] h-5 ${config.className}`}>{config.label}</Badge>

        {/* Documento */}
        {doc?.doc_url ? (
          <div className="flex items-center gap-1">
            <a href={doc.doc_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-[10px] text-primary hover:underline max-w-[100px] truncate">
              <Download className="w-3 h-3" />{doc.doc_nombre}
            </a>
            <button onClick={() => handleDelete("doc")} className="text-destructive hover:opacity-70">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <>
            <input ref={docRef} type="file" className="hidden" onChange={e => e.target.files?.[0] && handleUpload("doc", e.target.files[0])} />
            <Button variant="outline" size="sm" className="h-6 text-[10px] px-2 gap-1"
              disabled={uploading === "doc"} onClick={() => docRef.current?.click()}>
              {uploading === "doc" ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
              Documento
            </Button>
          </>
        )}

        {/* Plantilla */}
        {doc?.plantilla_url ? (
          <div className="flex items-center gap-1">
            <a href={doc.plantilla_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-[10px] text-primary hover:underline max-w-[100px] truncate">
              <Download className="w-3 h-3" />{doc.plantilla_nombre}
            </a>
            <button onClick={() => handleDelete("plantilla")} className="text-destructive hover:opacity-70">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <>
            <input ref={plantillaRef} type="file" className="hidden" onChange={e => e.target.files?.[0] && handleUpload("plantilla", e.target.files[0])} />
            <Button variant="outline" size="sm" className="h-6 text-[10px] px-2 gap-1"
              disabled={uploading === "plantilla"} onClick={() => plantillaRef.current?.click()}>
              {uploading === "plantilla" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
              Plantilla
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
