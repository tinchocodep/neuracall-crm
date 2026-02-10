# 🧠 Neuracall CRM

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/tinchocodep/neuracall-crm)

Sistema de gestión de relaciones con clientes (CRM) diseñado específicamente para **Neuracall**, una agencia de software especializada en inteligencia artificial.

![Neuracall](./public/neuracall-logo.svg)

## ✨ Características Principales

### 🎯 Dashboard Inteligente
- Métricas en tiempo real de proyectos de IA
- Visualización de ingresos y crecimiento
- Actividad reciente del equipo
- KPIs personalizados para agencia de IA

### 👥 Gestión de CRM
- **Clientes**: Base de datos de empresas activas
- **Contactos**: Directorio de personas en empresas
- **Prospectos**: Pipeline de empresas potenciales
- **Oportunidades**: Proyectos de IA en negociación

### 🧠 Proyectos de IA
- Gestión de proyectos activos
- Portfolio de casos completados
- Seguimiento de milestones
- Asignación de equipo

### 💰 Ventas y Finanzas
- Cotizador de proyectos de IA
- Control presupuestario
- Tesorería y flujo de caja
- Gestión de gastos y nómina

### 📋 Operaciones
- Gestión de tareas
- Calendario compartido
- Seguimiento de actividades

## 🚀 Inicio Rápido

### Prerrequisitos
- Node.js 18+ 
- npm o yarn
- Cuenta en Supabase

### Instalación

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd polar-curiosity
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env
```

Edita `.env` y agrega tus credenciales de Supabase:
```env
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_clave_anonima
```

4. **Configurar base de datos**

Sigue las instrucciones en [DATABASE.md](./DATABASE.md) para crear las tablas necesarias en Supabase.

5. **Ejecutar en desarrollo**
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

## 📁 Estructura del Proyecto

```
polar-curiosity/
├── public/
│   └── neuracall-logo.svg       # Logo de Neuracall
├── src/
│   ├── components/
│   │   └── layout/
│   │       ├── Layout.tsx        # Layout principal
│   │       ├── Sidebar.tsx       # Navegación lateral
│   │       └── TopBar.tsx        # Barra superior
│   ├── lib/
│   │   └── supabase.ts          # Cliente de Supabase
│   ├── pages/
│   │   └── Dashboard.tsx        # Dashboard principal
│   ├── utils/
│   │   └── cn.ts                # Utilidades
│   ├── App.tsx                  # Configuración de rutas
│   ├── index.css                # Estilos globales
│   └── main.tsx                 # Punto de entrada
├── .env.example                 # Template de variables
├── DATABASE.md                  # Documentación de BD
├── MODULES.md                   # Descripción de módulos
└── README.md                    # Este archivo
```

## 🎨 Diseño y Branding

### Colores Neuracall
- **Azul Principal**: `#3B82F6` (Blue 500)
- **Azul Claro**: `#60A5FA` (Blue 400)
- **Cyan**: `#06B6D4` (Cyan 500)
- **Fondo Oscuro**: `#0F172A` (Slate 900)

### Tipografía
- Sistema de fuentes nativo optimizado
- Soporte para dark mode

### Componentes
- Glassmorphism effects
- Animaciones con Framer Motion
- Gráficos con Recharts
- Iconos de Lucide React

## 📊 Base de Datos

El sistema utiliza **Supabase** (PostgreSQL) con las siguientes tablas:

- `clients` - Clientes activos
- `contacts` - Contactos de empresas
- `prospects` - Prospectos en pipeline
- `opportunities` - Oportunidades de proyectos
- `ai_projects` - Proyectos de IA

Ver [DATABASE.md](./DATABASE.md) para el schema completo y scripts SQL.

## 🔧 Tecnologías

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **Database**: Supabase (PostgreSQL)
- **Charts**: Recharts
- **Animations**: Framer Motion
- **Icons**: Lucide React

## 📝 Módulos

Ver [MODULES.md](./MODULES.md) para una descripción detallada de cada módulo y su función.

## 🔐 Seguridad

- Row Level Security (RLS) habilitado en Supabase
- Autenticación mediante Supabase Auth
- Variables de entorno para credenciales sensibles

## 🚧 Desarrollo

### Scripts Disponibles

```bash
# Desarrollo
npm run dev

# Build para producción
npm run build

# Preview de producción
npm run preview

# Linting
npm run lint
```

### Agregar Nuevos Módulos

1. Crear componente en `src/pages/`
2. Agregar ruta en `src/App.tsx`
3. Actualizar navegación en `src/components/layout/Sidebar.tsx`
4. Documentar en `MODULES.md`

## 📄 Licencia

Propiedad de Neuracall. Todos los derechos reservados.

## 👥 Equipo

Desarrollado con ❤️ por el equipo de Neuracall

---

**Neuracall** - AI Agency 🧠
