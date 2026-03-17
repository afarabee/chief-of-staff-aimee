// v2 — mobile responsive, conversion fix, AI suggestions persistence
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "@/contexts/AppContext";
import { AppLayout } from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import Tasks from "./pages/Tasks";
import Ideas from "./pages/Ideas";
import Categories from "./pages/Categories";
import CategoryDetail from "./pages/CategoryDetail";
import Assets from "./pages/Assets";
import Providers from "./pages/Providers";
import Maintenance from "./pages/Maintenance";
import CalendarPage from "./pages/Calendar";
import AiActivity from "./pages/AiActivity";
import AiEnrichmentDetail from "./pages/AiEnrichmentDetail";
import ShoppingList from "./pages/ShoppingList";
import CommandCenter from "./pages/CommandCenter";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      refetchOnWindowFocus: true,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AppProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppLayout>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/ideas" element={<Ideas />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/category/:categoryId" element={<CategoryDetail />} />
              <Route path="/assets" element={<Assets />} />
              <Route path="/providers" element={<Providers />} />
              <Route path="/maintenance" element={<Maintenance />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/ai-activity" element={<AiActivity />} />
              <Route path="/ai-activity/:id" element={<AiEnrichmentDetail />} />
              <Route path="/shopping-list" element={<ShoppingList />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </BrowserRouter>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
