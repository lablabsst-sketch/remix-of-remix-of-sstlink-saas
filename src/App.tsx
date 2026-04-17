import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Landing from "./pages/Landing.tsx";
import Login from "./pages/Login.tsx";
import Register from "./pages/Register.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import SGSST from "./pages/SGSST.tsx";
import Trabajadores from "./pages/Trabajadores.tsx";
import TrabajadorDetail from "./pages/TrabajadorDetail.tsx";
import Clientes from "./pages/Clientes.tsx";
import Portal from "./pages/Portal.tsx";
import NotFound from "./pages/NotFound.tsx";
import Accidentalidad from "./pages/Accidentalidad.tsx";
import Ausentismo from "./pages/Ausentismo.tsx";
import ExamenesMedicos from "./pages/ExamenesMedicos.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/auth" element={<Navigate to="/login" replace />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sgsst"
              element={
                <ProtectedRoute>
                  <SGSST />
                </ProtectedRoute>
              }
            />
            <Route
              path="/trabajadores"
              element={
                <ProtectedRoute>
                  <Trabajadores />
                </ProtectedRoute>
              }
            />
            <Route
              path="/trabajadores/:id"
              element={
                <ProtectedRoute>
                  <TrabajadorDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/clientes"
              element={
                <ProtectedRoute>
                  <Clientes />
                </ProtectedRoute>
              }
            />
            <Route path="/portal" element={<Portal />} />
            <Route
              path="/accidentalidad"
              element={
                <ProtectedRoute>
                  <Accidentalidad />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ausentismo"
              element={
                <ProtectedRoute>
                  <Ausentismo />
                </ProtectedRoute>
              }
            />
            <Route
              path="/examenes-medicos"
              element={
                <ProtectedRoute>
                  <ExamenesMedicos />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
