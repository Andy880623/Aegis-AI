import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useParams } from "react-router-dom";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Workspace from "./pages/Workspace";
import AISystems from "./pages/AISystems";
import AISystemDetail from "./pages/AISystemDetail";
import ControlsPage from "./pages/Controls";
import ResidualRisk from "./pages/ResidualRisk";
import ReportsPage from "./pages/Reports";
import SettingsPage from "./pages/Settings";
import KnowledgeBasePage from "./pages/KnowledgeBase";
import Introduction from "./pages/Introduction";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function LegacyFeatureRedirect() {
  const { id } = useParams();
  return <Navigate to={id ? `/systems/${id}` : "/systems"} replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/introduction" element={<Introduction />} />
          <Route path="/workspace" element={<Workspace />} />
          <Route path="/interview" element={<Navigate to="/workspace" replace />} />
          <Route path="/systems" element={<AISystems />} />
          <Route path="/systems/:id" element={<AISystemDetail />} />
          <Route path="/controls" element={<ControlsPage />} />
          <Route path="/residual" element={<ResidualRisk />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/knowledge" element={<KnowledgeBasePage />} />
          <Route path="/settings" element={<SettingsPage />} />

          {/* Legacy route compatibility */}
          <Route path="/new" element={<Navigate to="/workspace" replace />} />
          <Route path="/feature/:id" element={<LegacyFeatureRedirect />} />
          <Route path="/feature/:id/report" element={<Navigate to="/reports" replace />} />
          <Route path="/about" element={<Navigate to="/dashboard" replace />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
