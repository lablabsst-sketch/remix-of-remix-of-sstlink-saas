import { Shield } from "lucide-react";

interface HeroCardProps {
  companyName: string;
  protectionLevel?: string;
  accidentCount?: number;
}

export function HeroCard({ companyName, protectionLevel = "Nivel Básico", accidentCount = 0 }: HeroCardProps) {
  return (
    <div className="rounded-2xl bg-surface-dark text-primary-foreground p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <div className="flex-1 min-w-0">
        <h2 className="text-xl font-medium truncate">{companyName}</h2>
        <div className="flex items-center gap-2 mt-2">
          <Shield className="w-5 h-5 text-primary" />
          <span className="text-sm opacity-80">{protectionLevel}</span>
        </div>
      </div>
      <div className="bg-primary/20 rounded-xl px-5 py-3 text-center shrink-0">
        <p className="text-[22px] font-medium">{accidentCount}</p>
        <p className="text-[11px] opacity-70 mt-0.5">Accidentes AT</p>
      </div>
    </div>
  );
}
