import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface DashboardHeroProps {
  empresaNombre: string;
  nombreCompleto: string;
  numTrabajadores: number;
  nivelProteccion: number;
  accidentes: number;
  mesAnio: string;
  mesLabel: string;
}

export function DashboardHero({
  empresaNombre,
  nombreCompleto,
  numTrabajadores,
  nivelProteccion,
  accidentes,
  mesAnio,
}: DashboardHeroProps) {
  return (
    <div
      className="rounded-[14px] p-5 px-6 flex flex-col sm:flex-row items-start sm:items-center gap-5"
      style={{
        background: "linear-gradient(135deg, #0A0E1A 0%, #1a2035 100%)",
      }}
    >
      {/* Left */}
      <div className="flex-1 min-w-0">
        <p className="text-[10px] tracking-[0.8px] uppercase" style={{ color: "rgba(255,255,255,0.4)" }}>
          tu empresa
        </p>
        <h2 className="text-[17px] font-medium text-white mt-1 truncate">{empresaNombre}</h2>
        <p className="text-[12px] mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>
          Gestionado por {nombreCompleto} · {numTrabajadores} trabajadores
        </p>
      </div>

      {/* Right */}
      <div className="flex items-center gap-5 shrink-0">
        {/* Shield */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex flex-col items-center gap-1 cursor-default">
              <div className="relative" aria-label={`Nivel de protección: ${nivelProteccion}`}>
                <svg width="52" height="60" viewBox="0 0 52 60" fill="none" aria-hidden="true">
                  <path
                    d="M26 2L4 14v18c0 14 10 22 22 26 12-4 22-12 22-26V14L26 2z"
                    fill="rgba(255,107,44,0.15)"
                    stroke="#FF6B2C"
                    strokeWidth="1.5"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[18px] font-medium text-white">
                  {nivelProteccion}
                </span>
              </div>
              <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>
                Nivel de protección
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="bg-foreground text-background text-[11px]">
            Sube cada vez que completas una acción de SST
          </TooltipContent>
        </Tooltip>

        {/* Accident counter */}
        <div
          className="rounded-xl text-center px-5 py-3.5"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "0.5px solid rgba(255,255,255,0.1)",
          }}
        >
          <p className="text-[10px] tracking-[0.5px]" style={{ color: "rgba(255,255,255,0.35)" }}>
            {mesAnio}
          </p>
          <p className="text-[40px] font-medium text-white leading-tight">{accidentes}</p>
          <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.5)" }}>
            accidentes de trabajo
          </p>
          {accidentes === 0 ? (
            <div className="mt-2 rounded-lg px-3 py-1" style={{ background: "rgba(74,222,128,0.12)" }}>
              <span className="text-[10px] font-medium" style={{ color: "#4ADE80" }}>
                Tu equipo llegó sano a casa
              </span>
            </div>
          ) : (
            <div className="mt-2 rounded-lg px-3 py-1" style={{ background: "rgba(251,191,36,0.12)" }}>
              <span className="text-[10px] font-medium" style={{ color: "#FBB724" }}>
                Cada dato registrado es un paso hacia la mejora
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
