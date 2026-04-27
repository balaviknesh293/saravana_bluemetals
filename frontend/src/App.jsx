import { Navigate, Route, Routes } from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";
import AppShell from "./components/AppShell";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import CustomersPage from "./pages/CustomersPage";
import CustomerDashboardPage from "./pages/CustomerDashboardPage";
import VehiclesPage from "./pages/VehiclesPage";
import MaterialsPage from "./pages/MaterialsPage";
import SalesPage from "./pages/SalesPage";
import BalancePage from "./pages/BalancePage";
import ReportsPage from "./pages/ReportsPage";
import AccessPage from "./pages/AccessPage";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="customer-dashboard" element={<CustomerDashboardPage />} />
        <Route path="vehicles" element={<VehiclesPage />} />
        <Route path="materials" element={<MaterialsPage />} />
        <Route path="sales" element={<SalesPage />} />
        <Route path="balance" element={<BalancePage />} />
        <Route path="reports/daily" element={<ReportsPage type="daily" />} />
        <Route path="reports/weekly" element={<ReportsPage type="weekly" />} />
        <Route path="reports/monthly" element={<ReportsPage type="monthly" />} />
        <Route path="access" element={<AccessPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;