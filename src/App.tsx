import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Layout from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import Clients from './pages/Clients';
import Login from './pages/Login';
import Opportunities from './pages/Opportunities';
import Proposals from './pages/Proposals';
import Contacts from './pages/Contacts';
import Projects from './pages/Projects';
import Tasks from './pages/Tasks';
import TimeTracking from './pages/TimeTracking';
import Invoices from './pages/Invoices';
import Transactions from './pages/Transactions';
import Expenses from './pages/Expenses';
import Calendar from './pages/Calendar';
import ComingSoon from './components/common/ComingSoon';
import {
  FileText,
  Package, ArrowLeftRight, UserCog, UserCircle, Settings, Users
} from 'lucide-react';



function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Protected Area */}
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>

            {/* Redirect root to dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            <Route path="/dashboard" element={<Dashboard />} />

            {/* Ventas */}
            <Route path="/opportunities" element={<Opportunities />} />
            <Route path="/quotes" element={<Proposals />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/contacts" element={<Contacts />} />

            {/* Proyectos */}
            <Route path="/projects" element={<Projects />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/time-tracking" element={<TimeTracking />} />

            {/* Tesorería */}
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/expenses" element={<Expenses />} />

            {/* Calendario */}
            <Route path="/calendar" element={<Calendar />} />

            {/* Inventario */}
            <Route path="/inventory" element={<ComingSoon title="Inventario de Productos" icon={Package} />} />
            <Route path="/movements" element={<ComingSoon title="Movimientos de Stock" icon={ArrowLeftRight} />} />

            {/* RRHH */}
            <Route path="/employees" element={<ComingSoon title="Empleados" icon={UserCog} />} />
            <Route path="/payroll" element={<ComingSoon title="Nóminas" icon={FileText} />} />

            {/* Configuración */}
            <Route path="/profile" element={<ComingSoon title="Mi Perfil" icon={UserCircle} />} />
            <Route path="/company-settings" element={<ComingSoon title="Configuración de Empresa" icon={Settings} />} />
            <Route path="/users" element={<ComingSoon title="Gestión de Usuarios" icon={Users} />} />

            <Route path="/reports" element={<ComingSoon title="Reportes" />} />
            <Route path="/settings" element={<ComingSoon title="Configuración" />} />

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />

          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
