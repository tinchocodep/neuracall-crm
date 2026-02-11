# 🚀 Neuracall CRM

Un sistema CRM moderno y completo construido con React, TypeScript, Supabase y Discord.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## ✨ Características Principales

### 📊 Gestión Completa de CRM
- **Clientes**: Gestión completa de clientes con Ficha 360°
- **Contactos**: Administración de contactos vinculados a clientes
- **Oportunidades**: Pipeline de ventas con etapas personalizables
- **Proyectos**: Seguimiento de proyectos activos
- **Tareas**: Gestión de tareas y seguimiento
- **Calendario**: Programación de reuniones y eventos
- **Propuestas**: Creación y gestión de propuestas comerciales
- **Facturas**: Sistema de facturación integrado
- **Gastos**: Control de gastos y transacciones

### 👥 Gestión de Usuarios Avanzada
- **Perfiles completos** con foto de perfil
- **Roles y permisos** (Fundador, Admin, Supervisor, Comercial)
- **Multi-tenant** con aislamiento completo de datos
- **Activación/Desactivación** de usuarios
- **Edición de perfil** por cada usuario

### 📈 Historial de Actividad
- **Timeline completo** de interacciones por cliente
- **17 tipos de actividades** soportadas
- **Metadata enriquecida** en formato JSON
- **Búsqueda y filtrado** de actividades
- **Integración automática** con todas las acciones del CRM

### 💬 Integración con Discord
- **Chat en tiempo real** con el equipo
- **Notificaciones automáticas** de eventos importantes
- **Canales de voz** para reuniones de equipo
- **Webhooks personalizables** para cada tipo de evento
- **Interfaz flotante** no intrusiva

## 🛠️ Tecnologías

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Comunicación**: Discord Webhooks
- **Routing**: React Router v6
- **Icons**: Lucide React
- **Date Handling**: date-fns

## 📦 Instalación

### Prerrequisitos
- Node.js 18+ 
- npm o yarn
- Cuenta de Supabase
- Cuenta de Discord (opcional, para chat)

### Pasos

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/tinchocodep/neuracall-crm.git
   cd neuracall-crm
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   cp .env.example .env
   ```
   
   Edita `.env` y agrega tus credenciales:
   ```bash
   # Supabase
   VITE_SUPABASE_URL=tu_supabase_url
   VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key
   
   # Discord (opcional)
   VITE_DISCORD_WEBHOOK_URL=tu_discord_webhook_url
   VITE_DISCORD_GUILD_ID=tu_discord_server_id
   VITE_DISCORD_CHANNEL_ID=tu_discord_channel_id
   VITE_DISCORD_VOICE_CHANNEL_ID=tu_discord_voice_channel_id
   ```

4. **Configurar la base de datos**
   - Ve a tu proyecto de Supabase
   - Ejecuta las migraciones en `supabase/migrations/`
   - Configura las políticas RLS según la documentación

5. **Iniciar el servidor de desarrollo**
   ```bash
   npm run dev
   ```

6. **Abrir en el navegador**
   ```
   http://localhost:5173
   ```

## 📚 Documentación

- **[FEATURES.md](./FEATURES.md)** - Documentación completa de todas las funcionalidades
- **[DISCORD_SETUP.md](./DISCORD_SETUP.md)** - Guía paso a paso para configurar Discord
- **[src/examples/](./src/examples/)** - Ejemplos de código para desarrolladores

## 🚀 Despliegue

### Vercel (Recomendado)

1. **Conectar con Vercel**
   ```bash
   npm install -g vercel
   vercel
   ```

2. **Configurar variables de entorno en Vercel**
   - Ve a tu proyecto en Vercel
   - Settings → Environment Variables
   - Agrega todas las variables de `.env`

3. **Desplegar**
   ```bash
   vercel --prod
   ```

### Otras Plataformas

El proyecto es compatible con:
- Netlify
- AWS Amplify
- Google Cloud Run
- Cualquier servicio que soporte aplicaciones React

## 🏗️ Estructura del Proyecto

```
neuracall-crm/
├── src/
│   ├── components/          # Componentes React
│   │   ├── chat/           # Componentes de chat
│   │   ├── client/         # Componentes de clientes
│   │   ├── common/         # Componentes comunes
│   │   ├── layout/         # Layout y navegación
│   │   └── settings/       # Componentes de configuración
│   ├── contexts/           # Contextos de React (Auth, etc.)
│   ├── hooks/              # Custom hooks
│   ├── lib/                # Utilidades y configuración
│   ├── pages/              # Páginas de la aplicación
│   ├── services/           # Servicios (Discord, etc.)
│   ├── types/              # Tipos de TypeScript
│   └── examples/           # Ejemplos de código
├── public/                 # Archivos estáticos
├── supabase/              # Migraciones y configuración
└── docs/                  # Documentación adicional
```

## 🔐 Seguridad

- **RLS (Row Level Security)** habilitado en todas las tablas
- **Multi-tenant** con aislamiento completo de datos
- **Autenticación** mediante Supabase Auth
- **Variables de entorno** para credenciales sensibles
- **HTTPS** obligatorio en producción

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👨‍💻 Autor

**Martin Cabrera**
- GitHub: [@tinchocodep](https://github.com/tinchocodep)

## 🙏 Agradecimientos

- [Supabase](https://supabase.com) por el backend
- [Discord](https://discord.com) por la integración de chat
- [Tailwind CSS](https://tailwindcss.com) por el sistema de diseño
- [Lucide](https://lucide.dev) por los iconos

## 📞 Soporte

Si tienes preguntas o necesitas ayuda:
- Abre un [Issue](https://github.com/tinchocodep/neuracall-crm/issues)
- Consulta la [Documentación](./FEATURES.md)
- Revisa los [Ejemplos](./src/examples/)

---

⭐ Si este proyecto te fue útil, considera darle una estrella en GitHub!
