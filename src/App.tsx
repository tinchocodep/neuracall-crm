import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Layout from './components/layout/Layout'; // Default import!
import { Dashboard } from './pages/Dashboard';
import Clients from './pages/Clients'; // Default import
import Login from './pages/Login';

// Placeholder for future modules
function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-[50vh] text-center">
      <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-4 text-3xl">
        🚧
      </div>
      <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
      <p className="text-slate-400">Próximamente en Neuracall v2</p>
    </div>
  );
}

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

            <Route path="/clients" element={<Clients />} />
            <Route path="/clients/new" element={<ComingSoon title="Nuevo Cliente" />} />

            <Route path="/opportunities" element={<ComingSoon title="Oportunidades" />} />
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
