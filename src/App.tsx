import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import GreyScanLogin from "./pages/GreyScanLogin";
import RedTeamLogin from "./pages/RedTeamLogin";
import ResetPassword from "./pages/ResetPassword";
import RedTeam from "./pages/RedTeam";
import AdminRequests from "./pages/AdminRequests";
import NotFound from "./pages/NotFound";
import RequireAuth from "./components/RequireAuth";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Login screens — one per product, each with its own URL */}
          <Route path="/login" element={<GreyScanLogin />} />
          <Route path="/redteam/login" element={<RedTeamLogin />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/auth" element={<Navigate to="/login" replace />} />

          {/* Gated app routes */}
          <Route path="/" element={<RequireAuth loginPath="/login"><Index /></RequireAuth>} />
          <Route path="/redteam" element={<RequireAuth loginPath="/redteam/login"><RedTeam /></RequireAuth>} />
          <Route path="/admin/requests" element={<RequireAuth loginPath="/login"><AdminRequests /></RequireAuth>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
