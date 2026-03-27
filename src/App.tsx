import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/leave/AppLayout";
import DashboardPage from "./pages/DashboardPage";
import LeaveTypesPage from "./pages/LeaveTypesPage";
import LeaveGroupsPage from "./pages/LeaveGroupsPage";
import AssignmentPage from "./pages/AssignmentPage";
import RequestsPage from "./pages/RequestsPage";
import BalancesPage from "./pages/BalancesPage";
import ReportsPage from "./pages/ReportsPage";
import CalendarPage from "./pages/CalendarPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/leave-types" element={<LeaveTypesPage />} />
            <Route path="/leave-groups" element={<LeaveGroupsPage />} />
            <Route path="/assignment" element={<AssignmentPage />} />
            <Route path="/requests" element={<RequestsPage />} />
            <Route path="/balances" element={<BalancesPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
