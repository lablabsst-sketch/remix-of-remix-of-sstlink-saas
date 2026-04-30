import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Download, Upload, CheckCircle2, XCircle, Loader2, FileText, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type ImportTipo = "trabajadores" | "extintores" | "botiquines";

interface Col {
  key: string;
  required?: boolean;
  example: string;
  hint?: string;
}

const COLS: Record<ImportTipo, Col[]> = {
  trabajadores: [
    { key: "nombres",             required: true,  example: "María",            hint: "Primer y segundo nombre" },
    { key: "apellidos",           required: true,  example: "Gómez López",      hint: "Primer y segundo apellido" },
    { key: "tipo_documento",      required: true,  example: "CC",               hint: "CC | CE | PP | TI | PEP" },
    { key: "numero_documento",    required: true,  example: "12345678"          },
    { key: "cargo",               required: true,  example: "Operario"          },
    { key: "fecha_ingreso",       required: true,  example: "2024-01-15",       hint: "YYYY-MM-DD" },
    { key: "fecha_nacimiento",                     example: "1990-05-15",       hint: "YYYY-MM-DD" },
    { key: "genero",                               example: "F",                hint: "M | F" },
    { key: "rh",                                   example: "O+",               hint: "A+ A- B+ B- O+ O- AB+ AB-" },
    { key: "email",                                example: "maria@empresa.com" },
    { key: "telefono",                             example: "3001234567"        },
    { key: "tipo_contrato",                        example: "indefinido",       hint: "indefinido | fijo | prestacion_servicios | aprendizaje" },
    { key: "tipo_trabajador",                      example: "propio",           hint: "propio | contratista" },
    { key: "arl",                                  example: "Sura"              },
    { key: "eps",                                  example: "Nueva EPS"         },
    { key: "pension",                              example: "Colpensiones"      },
    { key: "caja_compensacion",                    example: "Compensar"         },
    { key: "ciudad",                               example: "Bogotá"            },
    { key: "departamento",                         example: "Cundinamarca"      },
    { key: "sede",                                 example: "Sede principal"    },
  ],
  extintores: [
    { key: "nombre",                      required: true, example: "EXT-001",            hint: "Identificador único del extintor" },
    { key: "ubicacion",                   required: true, example: "Planta baja pasillo A" },
    { key: "capacidad",                             example: "10 lb",              hint: "ej: 10 lb, 20 lb, 2.5 kg" },
    { key: "tipo_agente",                           example: "ABC",                hint: "ABC | CO2 | Agua | Espuma | Halón" },
    { key: "fecha_ultima_recarga",                  example: "2024-12-01",         hint: "YYYY-MM-DD" },
    { key: "fecha_proxima_inspeccion",              example: "2025-06-01",         hint: "YYYY-MM-DD" },
    { key: "notas",                                 example: ""                    },
  ],
  botiquines: [
    { key: "nombre",                      required: true, example: "BOT-001",            hint: "Identificador único del botiquín" },
    { key: "subtipo",                     required: true, example: "A",                  hint: "A | B | C" },
    { key: "ubicacion",                   required: true, example: "Oficina administrativa" },
    { key: "fecha_proxima_inspeccion",              example: "2025-06-01",         hint: "YYYY-MM-DD" },
    { key: "notas",                                 example: ""                    },
  ],
};

const TIPO_LABEL: Record<ImportTipo, string> = {
  trabajadores: "Trabajadores",
  extintores: "Extintores",
  botiquines: "Botiquines",
};

// ── CSV utilities ──────────────────────────────────────────────────────────────

function escapeCSV(val: string) {
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

function buildTemplate(tipo: ImportTipo): string {
  const cols = COLS[tipo];
  const lines: string[] = [];

  // Instruction rows (prefixed with #, will be skipped by parser)
  lines.push("# INSTRUCCIONES: Complete los datos a partir de la fila 3 (no modifique los encabezados).");
  lines.push("# Columnas marcadas con * son REQUERIDAS. Las fechas deben estar en formato YYYY-MM-DD.");

  if (tipo === "trabajadores") {
    lines.push("# tipo_documento: CC=Cédula | CE=Cédula Extranjería | PP=Pasaporte | TI=Tarjeta Identidad | PEP");
    lines.push("# tipo_contrato: indefinido | fijo | prestacion_servicios | aprendizaje");
    lines.push("# tipo_trabajador: propio | contratista");
  } else if (tipo === "extintores") {
    lines.push("# tipo_agente: ABC | CO2 | Agua | Espuma | Halón");
  } else if (tipo === "botiquines") {
    lines.push("# subtipo: A=Básico | B=Intermedio | C=Avanzado (con medicamentos)");
  }

  // Header row
  const headers = cols.map(c => escapeCSV(c.required ? `${c.key}*` : c.key));
  lines.push(headers.join(","));

  // Example row
  const example = cols.map(c => escapeCSV(c.example));
  lines.push(example.join(","));

  return lines.join("\n");
}

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");

  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;

    const row: string[] = [];
    let inQuotes = false;
    let field = "";

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (ch === "," && !inQuotes) {
        row.push(field);
        field = "";
      } else {
        field += ch;
      }
    }
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function validateRow(row: Record<string, string>, tipo: ImportTipo): string[] {
  const errors: string[] = [];
  const cols = COLS[tipo];

  for (const col of cols) {
    if (col.required && !row[col.key]?.trim()) {
      errors.push(`"${col.key}" es requerido`);
    }
  }

  const dateFields =
    tipo === "trabajadores"
      ? ["fecha_nacimiento", "fecha_ingreso"]
      : tipo === "extintores"
      ? ["fecha_ultima_recarga", "fecha_proxima_inspeccion"]
      : ["fecha_proxima_inspeccion"];

  for (const field of dateFields) {
    const val = row[field]?.trim();
    if (val && !/^\d{4}-\d{2}-\d{2}$/.test(val)) {
      errors.push(`"${field}" debe ser YYYY-MM-DD`);
    }
  }

  if (tipo === "botiquines") {
    const sub = row.subtipo?.trim().toUpperCase();
    if (row.subtipo?.trim() && !["A", "B", "C"].includes(sub)) {
      errors.push('"subtipo" debe ser A, B o C');
    }
  }

  return errors;
}

interface ParsedRow {
  raw: Record<string, string>;
  errors: string[];
  rowNum: number;
}

// ── Component ──────────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tipo: ImportTipo;
  onSuccess?: () => void;
}

export function ImportarModal({ open, onOpenChange, tipo, onSuccess }: Props) {
  const { empresa } = useAuth();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState(false);
  const [importedCount, setImportedCount] = useState(0);

  const cols = COLS[tipo];

  // ── Download template ──────────────────────────────────────────────────────
  const handleDownload = () => {
    const content = buildTemplate(tipo);
    const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `plantilla_${tipo}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ── Parse uploaded file ────────────────────────────────────────────────────
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setDone(false);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const matrix = parseCSV(text);
      if (matrix.length === 0) {
        toast({ title: "Archivo vacío o sin datos", variant: "destructive" });
        return;
      }

      // First non-comment row is headers
      const rawHeaders = matrix[0].map(h => h.replace(/\*$/, "").trim().toLowerCase());
      const dataRows = matrix.slice(1);

      const parsed: ParsedRow[] = dataRows.map((cells, idx) => {
        const raw: Record<string, string> = {};
        rawHeaders.forEach((h, i) => { raw[h] = cells[i] ?? ""; });
        const errors = validateRow(raw, tipo);
        return { raw, errors, rowNum: idx + 2 };
      });

      setRows(parsed);
    };
    reader.readAsText(file, "UTF-8");
  };

  // ── Import ─────────────────────────────────────────────────────────────────
  const validRows = rows.filter(r => r.errors.length === 0);
  const invalidRows = rows.filter(r => r.errors.length > 0);

  const handleImport = async () => {
    if (!empresa?.id || validRows.length === 0) return;
    setImporting(true);

    try {
      let error: any = null;

      if (tipo === "trabajadores") {
        const records = validRows.map(({ raw: r }) => ({
          empresa_id: empresa.id,
          nombres: r.nombres.trim(),
          apellidos: r.apellidos.trim(),
          tipo_documento: r.tipo_documento.trim().toUpperCase(),
          numero_documento: r.numero_documento.trim(),
          cargo: r.cargo?.trim() || null,
          fecha_ingreso: r.fecha_ingreso?.trim() || new Date().toISOString().split("T")[0],
          fecha_nacimiento: r.fecha_nacimiento?.trim() || null,
          genero: r.genero?.trim() || null,
          rh: r.rh?.trim() || null,
          email: r.email?.trim() || null,
          telefono: r.telefono?.trim() || null,
          tipo_contrato: r.tipo_contrato?.trim() || null,
          tipo_trabajador: r.tipo_trabajador?.trim() || "propio",
          arl: r.arl?.trim() || null,
          eps: r.eps?.trim() || null,
          pension: r.pension?.trim() || null,
          caja_compensacion: r.caja_compensacion?.trim() || null,
          ciudad: r.ciudad?.trim() || null,
          departamento: r.departamento?.trim() || null,
          sede: r.sede?.trim() || null,
          estado: "pendiente",
        }));
        ({ error } = await (supabase as any).from("trabajadores").insert(records));

      } else if (tipo === "extintores") {
        const records = validRows.map(({ raw: r }) => ({
          empresa_id: empresa.id,
          tipo: "extintores",
          nombre: r.nombre.trim(),
          ubicacion: r.ubicacion?.trim() || null,
          fecha_proxima_inspeccion: r.fecha_proxima_inspeccion?.trim() || null,
          descripcion: r.notas?.trim() || null,
          info: {
            capacidad: r.capacidad?.trim() || "",
            tipo_agente: r.tipo_agente?.trim() || "",
            fecha_ultima_recarga: r.fecha_ultima_recarga?.trim() || "",
          },
          estado: "activo",
        }));
        ({ error } = await (supabase as any).from("activos").insert(records));

      } else if (tipo === "botiquines") {
        const records = validRows.map(({ raw: r }) => ({
          empresa_id: empresa.id,
          tipo: "botiquines",
          nombre: r.nombre.trim(),
          subtipo: r.subtipo?.trim().toUpperCase() || null,
          ubicacion: r.ubicacion?.trim() || null,
          fecha_proxima_inspeccion: r.fecha_proxima_inspeccion?.trim() || null,
          descripcion: r.notas?.trim() || null,
          info: {},
          estado: "activo",
        }));
        ({ error } = await (supabase as any).from("activos").insert(records));
      }

      if (error) throw error;

      setImportedCount(validRows.length);
      setDone(true);
      onSuccess?.();
      toast({ title: `${validRows.length} registros importados correctamente` });
    } catch (err: any) {
      toast({ title: "Error al importar", description: err.message, variant: "destructive" });
    } finally {
      setImporting(false);
    }
  };

  // ── Reset on close ─────────────────────────────────────────────────────────
  const handleClose = (v: boolean) => {
    if (!v) {
      setRows([]);
      setFileName("");
      setDone(false);
      setImportedCount(0);
      if (fileRef.current) fileRef.current.value = "";
    }
    onOpenChange(v);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar {TIPO_LABEL[tipo]} desde CSV</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-1">

          {/* Step 1: Download template */}
          <div className="bg-accent/40 rounded-lg p-4 flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-xs font-bold text-primary">1</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium mb-1">Descarga la plantilla</p>
              <p className="text-xs text-muted-foreground mb-3">
                La plantilla contiene los encabezados correctos y una fila de ejemplo.
                Los campos con <span className="font-semibold text-foreground">*</span> son requeridos.
              </p>
              <Button variant="outline" size="sm" onClick={handleDownload} className="gap-1.5">
                <Download className="w-3.5 h-3.5" />
                Descargar plantilla_{tipo}.csv
              </Button>
            </div>
          </div>

          {/* Fields reference */}
          <details className="text-xs">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground select-none">
              Ver campos disponibles ({cols.length})
            </summary>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full border border-border rounded-md text-[11px]">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left px-2 py-1.5 font-medium">Campo</th>
                    <th className="text-left px-2 py-1.5 font-medium">Requerido</th>
                    <th className="text-left px-2 py-1.5 font-medium">Ejemplo / Valores</th>
                  </tr>
                </thead>
                <tbody>
                  {cols.map(col => (
                    <tr key={col.key} className="border-t border-border">
                      <td className="px-2 py-1.5 font-mono">{col.key}</td>
                      <td className="px-2 py-1.5">{col.required ? <span className="text-primary font-semibold">Sí</span> : "No"}</td>
                      <td className="px-2 py-1.5 text-muted-foreground">{col.hint || col.example || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>

          {/* Step 2: Upload */}
          <div className="bg-accent/40 rounded-lg p-4 flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-xs font-bold text-primary">2</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium mb-1">Sube el archivo diligenciado</p>
              <p className="text-xs text-muted-foreground mb-3">
                Guarda el archivo como CSV (UTF-8) antes de subirlo.
              </p>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={handleFile}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileRef.current?.click()}
                className="gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                {fileName ? `Cambiar archivo` : "Seleccionar archivo CSV"}
              </Button>
              {fileName && (
                <p className="mt-1.5 text-xs text-muted-foreground flex items-center gap-1">
                  <FileText className="w-3 h-3" /> {fileName}
                </p>
              )}
            </div>
          </div>

          {/* Preview */}
          {rows.length > 0 && !done && (
            <div>
              {/* Summary chips */}
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs text-muted-foreground">{rows.length} filas detectadas</span>
                {validRows.length > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
                    <CheckCircle2 className="w-3 h-3" /> {validRows.length} válidas
                  </span>
                )}
                {invalidRows.length > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs text-red-700 bg-red-50 border border-red-200 rounded-full px-2 py-0.5">
                    <XCircle className="w-3 h-3" /> {invalidRows.length} con errores
                  </span>
                )}
              </div>

              {/* Preview table — first 5 cols + errors */}
              <div className="overflow-x-auto rounded-lg border border-border text-[11px]">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left px-2 py-2 font-medium text-muted-foreground">Fila</th>
                      {cols.slice(0, 5).map(c => (
                        <th key={c.key} className="text-left px-2 py-2 font-medium text-muted-foreground">{c.key}</th>
                      ))}
                      {cols.length > 5 && (
                        <th className="text-left px-2 py-2 font-medium text-muted-foreground">+{cols.length - 5} más</th>
                      )}
                      <th className="text-left px-2 py-2 font-medium text-muted-foreground">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 20).map(row => (
                      <tr
                        key={row.rowNum}
                        className={cn(
                          "border-t border-border",
                          row.errors.length > 0 ? "bg-red-50" : "bg-background"
                        )}
                      >
                        <td className="px-2 py-1.5 text-muted-foreground">{row.rowNum}</td>
                        {cols.slice(0, 5).map(c => (
                          <td key={c.key} className="px-2 py-1.5 truncate max-w-[120px]">
                            {row.raw[c.key] || <span className="text-muted-foreground/50">—</span>}
                          </td>
                        ))}
                        {cols.length > 5 && <td className="px-2 py-1.5 text-muted-foreground">…</td>}
                        <td className="px-2 py-1.5">
                          {row.errors.length === 0 ? (
                            <span className="text-green-600 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> OK
                            </span>
                          ) : (
                            <span className="text-red-600 flex items-center gap-1" title={row.errors.join(", ")}>
                              <AlertCircle className="w-3 h-3" /> {row.errors[0]}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {rows.length > 20 && (
                  <p className="text-center text-xs text-muted-foreground py-2 border-t border-border">
                    Mostrando 20 de {rows.length} filas. Se importarán todas las válidas.
                  </p>
                )}
              </div>

              {invalidRows.length > 0 && (
                <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                  Las filas con errores serán omitidas. Corrígelas en el CSV y sube el archivo nuevamente.
                </p>
              )}
            </div>
          )}

          {/* Done state */}
          {done && (
            <div className="rounded-lg bg-green-50 border border-green-200 p-4 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-800">
                  {importedCount} {TIPO_LABEL[tipo].toLowerCase()} importados exitosamente
                </p>
                <p className="text-xs text-green-700 mt-0.5">
                  Ya puedes verlos en la lista.
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={() => handleClose(false)}>
              {done ? "Cerrar" : "Cancelar"}
            </Button>
            {!done && validRows.length > 0 && (
              <Button
                size="sm"
                onClick={handleImport}
                disabled={importing}
                className="gap-1.5"
              >
                {importing ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Importando…</>
                ) : (
                  <><Upload className="w-3.5 h-3.5" /> Importar {validRows.length} registros</>
                )}
              </Button>
            )}
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
