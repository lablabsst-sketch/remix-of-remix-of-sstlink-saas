import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Shield, Users, FileText, BarChart3, ClipboardCheck, AlertTriangle,
  BookOpen, GraduationCap, ArrowRight, Check, Star, ExternalLink,
  ChevronRight, Mail, MapPin, Phone
} from "lucide-react";
import { useScrollFadeIn } from "@/hooks/useScrollFadeIn";

const fadeClass = (visible: boolean) =>
  `transition-all duration-700 ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`;

/* ───────── Navbar ───────── */
function LandingNav() {
  return (
    <nav className="sticky top-0 z-50 bg-surface/90 backdrop-blur border-b-[0.5px] border-border">
      <div className="max-w-6xl mx-auto flex items-center justify-between h-14 px-4 md:px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">S</span>
          </div>
          <span className="font-semibold text-foreground text-base">SSTLink</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition-colors">Características</a>
          <a href="#pricing" className="hover:text-foreground transition-colors">Planes</a>
          <a href="#blog" className="hover:text-foreground transition-colors">Blog</a>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          <a
            href="https://sstalent.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            SSTalent <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <Link to="/login">
            <Button variant="ghost" size="sm" className="text-xs">Iniciar sesión</Button>
          </Link>
          <Link to="/register">
            <Button size="sm" className="text-xs">Crear cuenta</Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}

/* ───────── Hero ───────── */
function HeroSection() {
  const { ref, isVisible } = useScrollFadeIn(0.1);
  return (
    <section ref={ref} className={`bg-background py-16 md:py-24 px-4 ${fadeClass(isVisible)}`}>
      <div className="max-w-4xl mx-auto text-center space-y-6">
        <span className="inline-block text-xs font-medium text-primary bg-accent px-3 py-1 rounded-full">
          Gestión SG-SST para Colombia 🇨🇴
        </span>
        <h1 className="text-3xl md:text-5xl font-bold text-foreground leading-tight">
          Gestiona la Seguridad y Salud en el Trabajo de tu empresa,{" "}
          <span className="text-primary">sin complicaciones</span>
        </h1>
        <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
          Centraliza trabajadores, documentos, capacitaciones, accidentes y cumplimiento normativo en una sola plataforma.
          Cumple la Resolución 0312 de 2019 con facilidad.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link to="/register">
            <Button size="lg" className="gap-2">
              Empieza gratis <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <a href="#features">
            <Button variant="outline" size="lg">Conocer más</Button>
          </a>
        </div>
        <p className="text-xs text-muted-foreground">No requiere tarjeta de crédito · Configuración en minutos</p>
      </div>
    </section>
  );
}

/* ───────── Features ───────── */
const features = [
  { icon: Users, title: "Gestión de Trabajadores", desc: "Fichas completas con datos personales, laborales, afiliaciones y documentos de cada empleado." },
  { icon: FileText, title: "Documentos SG-SST", desc: "Organiza y versiona todos los documentos exigidos por la normativa colombiana." },
  { icon: GraduationCap, title: "Capacitaciones", desc: "Programa, registra asistencia y controla el plan de formación anual." },
  { icon: AlertTriangle, title: "Accidentes e Incidentes", desc: "Reporta, investiga y da seguimiento a los eventos de seguridad." },
  { icon: ClipboardCheck, title: "Plan de Mejora", desc: "Crea planes de acción con seguimiento de ítems y responsables." },
  { icon: BarChart3, title: "Indicadores y Reportes", desc: "Dashboards con métricas de cumplimiento, ausentismo y accidentalidad." },
  { icon: Shield, title: "Contratistas", desc: "Gestiona los contratistas y sus empleados con la misma rigurosidad." },
  { icon: BookOpen, title: "Exámenes Médicos", desc: "Control de exámenes ocupacionales, restricciones y próximos controles." },
];

function FeaturesSection() {
  const { ref, isVisible } = useScrollFadeIn();
  return (
    <section ref={ref} id="features" className={`py-16 md:py-20 px-4 bg-surface ${fadeClass(isVisible)}`}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">Todo lo que necesitas para tu SG-SST</h2>
          <p className="text-muted-foreground mt-2 max-w-xl mx-auto">Módulos diseñados para cumplir la normativa colombiana de seguridad y salud en el trabajo.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f) => (
            <div key={f.title} className="bg-background rounded-xl border-[0.5px] border-border p-5 space-y-3 hover:shadow-sm transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                <f.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-sm text-foreground">{f.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────── Pricing ───────── */
const plans = [
  {
    name: "Starter",
    price: "Gratis",
    period: "",
    desc: "Para empresas que inician su SG-SST",
    features: ["Hasta 10 trabajadores", "Documentos básicos", "1 usuario administrador", "Dashboard de cumplimiento"],
    cta: "Empezar gratis",
    highlighted: false,
  },
  {
    name: "Profesional",
    price: "$149.000",
    period: "/mes",
    desc: "Para empresas en crecimiento",
    features: ["Hasta 50 trabajadores", "Todos los módulos", "3 usuarios", "Soporte prioritario", "Reportes avanzados"],
    cta: "Comenzar prueba",
    highlighted: true,
  },
  {
    name: "Empresarial",
    price: "Personalizado",
    period: "",
    desc: "Para grandes organizaciones",
    features: ["Trabajadores ilimitados", "Usuarios ilimitados", "API & integraciones", "Soporte dedicado", "Onboarding personalizado"],
    cta: "Contactar ventas",
    highlighted: false,
  },
];

function PricingSection() {
  const { ref, isVisible } = useScrollFadeIn();
  return (
    <section ref={ref} id="pricing" className={`py-16 md:py-20 px-4 bg-background ${fadeClass(isVisible)}`}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">Planes que se adaptan a tu empresa</h2>
          <p className="text-muted-foreground mt-2">Sin contratos a largo plazo. Cancela cuando quieras.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-xl border-[0.5px] p-6 flex flex-col ${
                plan.highlighted
                  ? "border-primary bg-accent/30 ring-1 ring-primary/20"
                  : "border-border bg-surface"
              }`}
            >
              {plan.highlighted && (
                <span className="self-start text-[10px] font-semibold text-primary bg-accent px-2 py-0.5 rounded-full mb-3">
                  Más popular
                </span>
              )}
              <h3 className="font-semibold text-foreground">{plan.name}</h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-bold text-foreground">{plan.price}</span>
                {plan.period && <span className="text-sm text-muted-foreground">{plan.period}</span>}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{plan.desc}</p>
              <ul className="mt-5 space-y-2 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-foreground">
                    <Check className="w-3.5 h-3.5 text-secondary mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/register" className="mt-6">
                <Button
                  className="w-full text-xs"
                  variant={plan.highlighted ? "default" : "outline"}
                  size="sm"
                >
                  {plan.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────── Testimonials ───────── */
const testimonials = [
  {
    name: "María López",
    role: "Responsable SST",
    company: "Constructora Andina S.A.S",
    text: "SSTLink nos permitió pasar de carpetas físicas a un sistema digital en menos de una semana. El cumplimiento normativo ahora es mucho más sencillo.",
    rating: 5,
  },
  {
    name: "Carlos Gómez",
    role: "Gerente General",
    company: "Translogística del Valle",
    text: "Antes de SSTLink gastábamos días preparando las auditorías. Ahora toda la información está a un clic. La inversión se pagó sola.",
    rating: 5,
  },
  {
    name: "Ana Rodríguez",
    role: "Coordinadora HSEQ",
    company: "Alimentos del Pacífico",
    text: "Lo que más me gusta es la gestión de documentos por trabajador. Puedo ver vencimientos, subir soportes y mantener todo organizado.",
    rating: 5,
  },
];

function TestimonialsSection() {
  const { ref, isVisible } = useScrollFadeIn();
  return (
    <section ref={ref} id="testimonials" className={`py-16 md:py-20 px-4 bg-surface ${fadeClass(isVisible)}`}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">Lo que dicen nuestros clientes</h2>
          <p className="text-muted-foreground mt-2">Empresas colombianas que confían en SSTLink.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {testimonials.map((t) => (
            <div key={t.name} className="bg-background rounded-xl border-[0.5px] border-border p-5 space-y-4">
              <div className="flex gap-0.5">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-sm text-foreground leading-relaxed">"{t.text}"</p>
              <div>
                <p className="text-sm font-medium text-foreground">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role} · {t.company}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────── CTA ───────── */
function CTASection() {
  const { ref, isVisible } = useScrollFadeIn();
  return (
    <section ref={ref} className={`py-16 md:py-20 px-4 bg-background ${fadeClass(isVisible)}`}>
      <div className="max-w-3xl mx-auto text-center bg-[hsl(var(--surface-dark))] rounded-2xl p-8 md:p-12 space-y-5">
        <h2 className="text-2xl md:text-3xl font-bold text-white">
          ¿Listo para digitalizar tu SG-SST?
        </h2>
        <p className="text-sm text-white/70 max-w-lg mx-auto">
          Únete a cientos de empresas colombianas que ya gestionan su seguridad y salud en el trabajo con SSTLink.
        </p>
        <Link to="/register">
          <Button size="lg" className="gap-2 mt-2">
            Crear cuenta gratis <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </section>
  );
}

/* ───────── Footer ───────── */
const blogPosts = [
  { title: "Guía completa para implementar el SG-SST en tu empresa", slug: "guia-implementar-sg-sst" },
  { title: "Resolución 0312 de 2019: Todo lo que debes saber", slug: "resolucion-0312-2019" },
  { title: "¿Cómo calcular los indicadores de accidentalidad?", slug: "indicadores-accidentalidad" },
  { title: "5 errores comunes en la gestión de seguridad y salud en el trabajo", slug: "errores-gestion-sst" },
];

function Footer() {
  return (
    <footer id="blog" className="bg-[hsl(var(--surface-dark))] text-white/80 pt-12 pb-6 px-4">
      <div className="max-w-6xl mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Brand */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xs">S</span>
            </div>
            <span className="font-semibold text-white text-sm">SSTLink</span>
          </div>
          <p className="text-xs text-white/50 leading-relaxed">
            Plataforma líder para la gestión del Sistema de Seguridad y Salud en el Trabajo (SG-SST) en Colombia.
          </p>
        </div>

        {/* Links */}
        <div>
          <h4 className="text-xs font-semibold text-white mb-3 uppercase tracking-wider">Producto</h4>
          <ul className="space-y-2 text-xs">
            <li><a href="#features" className="hover:text-white transition-colors">Características</a></li>
            <li><a href="#pricing" className="hover:text-white transition-colors">Planes y precios</a></li>
            <li>
              <a href="https://sstalent.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1">
                SSTalent <ExternalLink className="w-3 h-3" />
              </a>
            </li>
          </ul>
        </div>

        {/* Blog */}
        <div>
          <h4 className="text-xs font-semibold text-white mb-3 uppercase tracking-wider">Blog</h4>
          <ul className="space-y-2 text-xs">
            {blogPosts.map((post) => (
              <li key={post.slug}>
                <a href={`/blog/${post.slug}`} className="hover:text-white transition-colors flex items-start gap-1">
                  <ChevronRight className="w-3 h-3 mt-0.5 shrink-0 text-primary" />
                  <span className="line-clamp-2">{post.title}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="text-xs font-semibold text-white mb-3 uppercase tracking-wider">Contacto</h4>
          <ul className="space-y-2 text-xs">
            <li className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-primary" /> soporte@sstlink.com</li>
            <li className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-primary" /> +57 300 123 4567</li>
            <li className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-primary" /> Bogotá, Colombia</li>
          </ul>
        </div>
      </div>

      <div className="max-w-6xl mx-auto mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-white/40">
        <p>© {new Date().getFullYear()} SSTLink. Todos los derechos reservados.</p>
        <div className="flex gap-4">
          <a href="/terminos" className="hover:text-white/60 transition-colors">Términos de uso</a>
          <a href="/privacidad" className="hover:text-white/60 transition-colors">Política de privacidad</a>
        </div>
      </div>
    </footer>
  );
}

/* ───────── Page ───────── */
export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col">
      <LandingNav />
      <main className="flex-1">
        <HeroSection />
        <FeaturesSection />
        <PricingSection />
        <TestimonialsSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
