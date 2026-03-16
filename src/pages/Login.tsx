import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const loginSchema = z.object({
  nit: z.string().trim().min(1, "El NIT es requerido").max(20),
  email: z.string().trim().email("Correo electrónico inválido").max(255),
  password: z.string().min(6, "Mínimo 6 caracteres").max(128),
});

export default function Login() {
  const [nit, setNit] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = loginSchema.safeParse({ nit, email, password });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: result.data.email,
        password: result.data.password,
      });
      if (error) throw error;
      navigate("/");
    } catch (err: any) {
      toast({
        title: "Error al ingresar",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-medium text-lg">S</span>
          </div>
          <span className="text-xl font-medium text-foreground">SSTLink</span>
        </div>

        <div className="bg-card rounded-xl border-[0.5px] border-border p-6">
          <h1 className="text-lg font-medium text-foreground mb-1">Iniciar sesión</h1>
          <p className="text-sm text-muted-foreground mb-6">Ingresa tus credenciales para acceder</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="nit" className="text-xs text-muted-foreground">NIT de la empresa</Label>
              <Input
                id="nit"
                placeholder="900.123.456-7"
                value={nit}
                onChange={(e) => setNit(e.target.value)}
                maxLength={20}
              />
              {errors.nit && <p className="text-xs text-destructive">{errors.nit}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs text-muted-foreground">Correo RUT</Label>
              <Input
                id="email"
                type="email"
                placeholder="correo@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={255}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs text-muted-foreground">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                maxLength={128}
              />
              {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Ingresando..." : "Ingresar"}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              Recuperar cuenta por RUT
            </button>
          </div>
        </div>

        <p className="text-sm text-center text-muted-foreground mt-6">
          ¿Tu empresa no está registrada?{" "}
          <Link to="/register" className="text-primary font-medium hover:underline">
            Crea una cuenta aquí
          </Link>
        </p>
      </div>
    </div>
  );
}
