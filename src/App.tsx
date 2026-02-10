import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';

function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center px-6">
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-6 shadow-lg shadow-blue-500/30">
        <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </div>
      <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">{title}</h2>
      <p className="text-muted-foreground text-lg mb-2">{description}</p>
      <p className="text-sm text-muted-foreground/70">Este módulo está en desarrollo activo</p>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />

          {/* CRM Routes */}
          <Route path="crm">
            <Route index element={<Navigate to="clients" replace />} />
            <Route
              path="clients"
              element={<ComingSoon
                title="Clientes"
                description="Gestión de empresas que ya son clientes activos de Neuracall"
              />}
            />
            <Route
              path="contacts"
              element={<ComingSoon
                title="Contactos"
                description="Directorio de personas dentro de empresas clientes y prospectos"
              />}
            />
            <Route
              path="prospects"
              element={<ComingSoon
                title="Prospectos"
                description="Pipeline de empresas potenciales en proceso de captación"
              />}
            />
            <Route
              path="opportunities"
              element={<ComingSoon
                title="Oportunidades"
                description="Proyectos de IA específicos en negociación"
              />}
            />
          </Route>

          {/* AI Projects Routes */}
          <Route path="ai-projects">
            <Route index element={<Navigate to="active" replace />} />
            <Route
              path="active"
              element={<ComingSoon
                title="Proyectos IA Activos"
                description="Gestión de proyectos de inteligencia artificial en desarrollo"
              />}
            />
            <Route
              path="completed"
              element={<ComingSoon
                title="Proyectos Completados"
                description="Archivo de proyectos de IA finalizados exitosamente"
              />}
            />
          </Route>

          {/* Sales Routes */}
          <Route path="sales">
            <Route index element={<Navigate to="quotes" replace />} />
            <Route
              path="quotes"
              element={<ComingSoon
                title="Cotizador"
                description="Generador de cotizaciones para proyectos de IA"
              />}
            />
            <Route
              path="budget"
              element={<ComingSoon
                title="Presupuesto"
                description="Control presupuestario y proyección de ventas"
              />}
            />
          </Route>

          {/* Operations Routes */}
          <Route path="operations">
            <Route index element={<Navigate to="tasks" replace />} />
            <Route
              path="tasks"
              element={<ComingSoon
                title="Tareas"
                description="Gestión de tareas y asignaciones del equipo"
              />}
            />
            <Route
              path="calendar"
              element={<ComingSoon
                title="Calendario"
                description="Agenda compartida con reuniones y eventos"
              />}
            />
          </Route>

          {/* Finance Routes */}
          <Route path="finance">
            <Route index element={<Navigate to="treasury" replace />} />
            <Route
              path="treasury"
              element={<ComingSoon
                title="Tesorería"
                description="Control de flujo de caja y proyecciones financieras"
              />}
            />
            <Route
              path="expenses"
              element={<ComingSoon
                title="Gastos"
                description="Control y categorización de gastos operativos"
              />}
            />
            <Route
              path="salaries"
              element={<ComingSoon
                title="Sueldos"
                description="Gestión de nómina y pagos al equipo"
              />}
            />
            <Route
              path="petty-cash"
              element={<ComingSoon
                title="Cajas Chicas"
                description="Control de gastos menores y reembolsos"
              />}
            />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
