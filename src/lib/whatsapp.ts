/**
 * WhatsApp integration via Make.com webhook.
 * If VITE_MAKE_WEBHOOK_URL is not set, falls back to wa.me links (admin clicks manually).
 *
 * To configure: add VITE_MAKE_WEBHOOK_URL=https://hook.make.com/xxx to Lovable env vars.
 */

const MAKE_WEBHOOK_URL = import.meta.env.VITE_MAKE_WEBHOOK_URL || "";
const APP_URL = import.meta.env.VITE_APP_URL || "https://app.sstlink.co";

export type WATipo = "info_capacitacion" | "firma_capacitacion";

export interface WAPayload {
  tipo: WATipo;
  telefono: string;       // E.164 sin + (ej: 573001234567)
  mensaje: string;
  empresa_id: string;
  capacitacion_id: string;
  trabajador_id?: string;
}

export interface WAResult {
  ok: boolean;
  fallbackUrl?: string;   // wa.me link when Make.com is not configured
}

export async function enviarWhatsApp(payload: WAPayload): Promise<WAResult> {
  const phone = payload.telefono.replace(/\D/g, "");
  if (!phone) return { ok: false };

  if (MAKE_WEBHOOK_URL) {
    try {
      const res = await fetch(MAKE_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return { ok: res.ok };
    } catch {
      // Fall through to wa.me
    }
  }

  // Fallback: open wa.me in new tab
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(payload.mensaje)}`;
  return { ok: false, fallbackUrl: url };
}

// ─── Message builders ─────────────────────────────────────────────────────────

export function mensajeInfoCapacitacion(params: {
  titulo: string;
  fecha: string;
  duracion?: number | null;
  modalidad: string;
  link_reunion?: string | null;
  responsable?: string | null;
  descripcion?: string | null;
}) {
  const fecha = new Date(params.fecha + "T12:00:00").toLocaleDateString("es-CO", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
  const modalidadIcon = params.modalidad === "virtual" ? "🖥️ Virtual" : "🏢 Presencial";
  const lines = [
    `📚 *Capacitación: ${params.titulo}*`,
    ``,
    `📅 Fecha: ${fecha}`,
    params.duracion ? `⏰ Duración: ${params.duracion}h` : null,
    `📍 Modalidad: ${modalidadIcon}`,
    params.link_reunion ? `🔗 Enlace: ${params.link_reunion}` : null,
    params.responsable ? `👤 Instructor: ${params.responsable}` : null,
    params.descripcion ? `\n📝 ${params.descripcion}` : null,
    ``,
    `_Esta capacitación es importante para tu seguridad. ¡Te esperamos!_`,
  ];
  return lines.filter((l) => l !== null).join("\n");
}

export function mensajeFirmaCapacitacion(params: {
  titulo: string;
  fecha: string;
  firmaToken: string;
}) {
  const fecha = new Date(params.fecha + "T12:00:00").toLocaleDateString("es-CO", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
  const url = `${APP_URL}/firma?t=${params.firmaToken}`;
  return [
    `✍️ *Confirma tu asistencia*`,
    ``,
    `Capacitación: *${params.titulo}*`,
    `📅 ${fecha}`,
    ``,
    `Ingresa al siguiente enlace y firma con tu número de documento:`,
    ``,
    `🔗 ${url}`,
    ``,
    `_Tu firma digital confirma tu participación en esta capacitación._`,
  ].join("\n");
}

// ─── PDF Consolidado ───────────────────────────────────────────────────────────

export interface AsistenteParaPDF {
  nombre: string;
  tipo: "trabajador" | "contratista";
  numero_documento?: string | null;
  cargo?: string | null;
  empresa?: string | null;
  asistio: boolean;
  firma_url?: string | null;
  firmado_en?: string | null;
}

export function generarPDFAsistencia(params: {
  capacitacion: {
    titulo: string; fecha: string; tipo?: string | null;
    duracion_horas?: number | null; modalidad: string;
    responsable?: string | null; descripcion?: string | null;
    link_reunion?: string | null;
  };
  asistentes: AsistenteParaPDF[];
  empresa: { nombre: string; nit?: string | null };
}) {
  const { capacitacion: cap, asistentes, empresa } = params;
  const firmaron = asistentes.filter((a) => a.firma_url).length;
  const fecha = new Date(cap.fecha + "T12:00:00").toLocaleDateString("es-CO", {
    year: "numeric", month: "long", day: "numeric",
  });

  const rows = asistentes.map((a, i) => `
    <tr>
      <td class="center">${i + 1}</td>
      <td>
        <strong>${a.nombre}</strong>
        ${a.empresa && a.tipo === "contratista" ? `<br><span class="sub">${a.empresa}</span>` : ""}
      </td>
      <td class="center"><span class="badge badge-${a.tipo}">${a.tipo === "contratista" ? "Proveedor" : "Propio"}</span></td>
      <td class="center">${a.numero_documento || "—"}</td>
      <td>${a.cargo || "—"}</td>
      <td class="center">
        ${a.firma_url
          ? `<img src="${a.firma_url}" class="firma-img" alt="firma" />`
          : `<div class="firma-vacia"></div>`
        }
      </td>
      <td class="center small">
        ${a.firmado_en
          ? new Date(a.firmado_en).toLocaleDateString("es-CO")
          : `<span class="muted">No firmó</span>`
        }
      </td>
    </tr>
  `).join("");

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Registro Asistencia — ${cap.titulo}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #1a1a1a; padding: 20px; }
    @media print {
      body { padding: 10mm 15mm; }
      .no-print { display: none; }
    }
    .header { border-bottom: 2.5px solid #1e293b; padding-bottom: 14px; margin-bottom: 18px; }
    .empresa-nombre { font-size: 18px; font-weight: 700; color: #1e293b; }
    .doc-tipo { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: .05em; margin-top: 2px; }
    .cap-titulo { font-size: 16px; font-weight: 700; margin-top: 8px; }
    .info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px 20px; margin-bottom: 18px; padding: 12px; background: #f8fafc; border-radius: 6px; border: 1px solid #e2e8f0; }
    .info-label { font-size: 9px; color: #94a3b8; text-transform: uppercase; letter-spacing: .05em; }
    .info-value { font-size: 12px; font-weight: 600; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #1e293b; color: white; padding: 8px 6px; font-size: 10px; text-align: left; text-transform: uppercase; letter-spacing: .04em; }
    td { border-bottom: 1px solid #e2e8f0; padding: 8px 6px; vertical-align: middle; }
    tr:nth-child(even) td { background: #f8fafc; }
    .center { text-align: center; }
    .small { font-size: 10px; }
    .sub { font-size: 10px; color: #64748b; }
    .muted { color: #94a3b8; font-style: italic; }
    .firma-img { max-width: 130px; max-height: 55px; object-fit: contain; border-bottom: 1px solid #334155; }
    .firma-vacia { width: 130px; height: 55px; border: 1.5px dashed #cbd5e1; display: inline-block; border-radius: 4px; }
    .badge { font-size: 9px; font-weight: 600; padding: 2px 7px; border-radius: 20px; }
    .badge-trabajador { background: #dbeafe; color: #1d4ed8; }
    .badge-contratista { background: #fef3c7; color: #92400e; }
    .resumen { margin-top: 14px; padding: 10px 14px; background: #f0fdf4; border: 1px solid #86efac; border-radius: 6px; font-size: 11px; }
    .resumen strong { color: #166534; }
    .footer { margin-top: 24px; padding-top: 10px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #94a3b8; display: flex; justify-content: space-between; }
    .print-btn { display: inline-block; margin-bottom: 16px; padding: 8px 16px; background: #1e293b; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; }
  </style>
</head>
<body>
  <button class="print-btn no-print" onclick="window.print()">🖨️ Imprimir / Guardar PDF</button>

  <div class="header">
    <div class="empresa-nombre">${empresa.nombre}</div>
    <div class="doc-tipo">Registro de Asistencia a Capacitación</div>
    <div class="cap-titulo">${cap.titulo}</div>
  </div>

  <div class="info-grid">
    <div><div class="info-label">Fecha</div><div class="info-value">${fecha}</div></div>
    <div><div class="info-label">Tipo</div><div class="info-value">${cap.tipo || "—"}</div></div>
    <div><div class="info-label">Duración</div><div class="info-value">${cap.duracion_horas ? cap.duracion_horas + " horas" : "—"}</div></div>
    <div><div class="info-label">Modalidad</div><div class="info-value">${cap.modalidad === "virtual" ? "🖥️ Virtual" : "🏢 Presencial"}</div></div>
    <div><div class="info-label">Instructor / Responsable</div><div class="info-value">${cap.responsable || "—"}</div></div>
    ${cap.link_reunion ? `<div><div class="info-label">Enlace</div><div class="info-value" style="word-break:break-all">${cap.link_reunion}</div></div>` : ""}
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:28px">N°</th>
        <th>Nombre completo</th>
        <th style="width:70px">Tipo</th>
        <th style="width:90px">Documento</th>
        <th>Cargo</th>
        <th style="width:140px">Firma digital</th>
        <th style="width:75px">Fecha firma</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="resumen">
    <strong>✅ ${firmaron} de ${asistentes.length}</strong> asistentes confirmaron su participación con firma digital.
    ${asistentes.length - firmaron > 0 ? `<span style="color:#ef4444"> · ${asistentes.length - firmaron} sin firma.</span>` : ""}
  </div>

  <div class="footer">
    <span>Generado por SSTLink · ${new Date().toLocaleString("es-CO")}</span>
    <span>${empresa.nit ? "NIT: " + empresa.nit : ""}</span>
  </div>
</body>
</html>`;

  const win = window.open("", "_blank", "width=1000,height=800");
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}
