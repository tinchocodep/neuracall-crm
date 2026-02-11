# Sistema de Gestión de Usuarios y Historial de Actividad

## ✅ Fase 1: Gestión de Usuarios Mejorada

### Funcionalidades Implementadas

#### 1. **Carga de Foto de Perfil**
- Componente `AvatarUpload` ubicado en `src/components/settings/AvatarUpload.tsx`
- Almacenamiento en Supabase Storage (bucket `avatars`)
- Características:
  - Límite de 5MB por imagen
  - Formatos soportados: JPG, PNG, WebP, GIF
  - Preview en tiempo real
  - Botón para eliminar avatar
  - Hover effect para cambiar/eliminar foto

#### 2. **Edición Completa de Perfil**
- Cada usuario puede editar su propio perfil en `/settings` o `/profile`
- Campos editables:
  - Nombre completo
  - Teléfono
  - Cargo
  - Ubicación
  - Avatar (foto de perfil)
- Campos de solo lectura:
  - Email
  - ID de usuario
  - Tenant ID
  - Rol

#### 3. **Creación de Nuevos Usuarios** (Solo Admin/Founder)
- Modal completo para crear usuarios: `src/components/settings/UserFormModal.tsx`
- Integración con Supabase Auth
- Campos requeridos:
  - Email (único)
  - Contraseña (mínimo 6 caracteres)
  - Nombre completo
  - Rol (Comercial, Supervisor, Administrador, Fundador)
- Campos opcionales:
  - Teléfono
  - Cargo
  - Ubicación
- Asignación automática al tenant del creador
- Estado activo/inactivo

#### 4. **Gestión de Usuarios** (Solo Admin/Founder)
- Vista de tabla con toda la información de usuarios
- Información mostrada:
  - Avatar
  - Nombre completo
  - Email
  - Teléfono
  - Cargo
  - Ubicación
  - Rol (con colores distintivos)
  - Estado (activo/inactivo)
- Acciones disponibles:
  - Editar usuario
  - Activar/Desactivar usuario con un clic
- Roles con colores:
  - 🟣 Fundador (púrpura)
  - 🔵 Administrador (azul)
  - 🟢 Supervisor (verde esmeralda)
  - 🟠 Comercial (naranja)
  - ⚪ Miembro (gris)

### Base de Datos

#### Nuevos campos en `users`:
```sql
phone TEXT
position TEXT
location TEXT
```

#### Nuevo campo en `tenant_users`:
```sql
is_active BOOLEAN DEFAULT true
```

#### Bucket de Storage:
- Nombre: `avatars`
- Público: Sí
- Límite de tamaño: 5MB
- Tipos MIME permitidos: image/jpeg, image/png, image/webp, image/gif

#### Políticas RLS:
- Los usuarios pueden subir/actualizar/eliminar solo sus propios avatares
- Todos pueden ver los avatares (público)

---

## ✅ Fase 2: Historial de Actividad por Cliente

### Funcionalidades Implementadas

#### 1. **Timeline de Actividades**
- Componente `ActivityTimeline` ubicado en `src/components/client/ActivityTimeline.tsx`
- Muestra un historial completo de todas las interacciones con cada cliente
- Integrado en la página Ficha 360 (`/ficha360/:id`)

#### 2. **Tipos de Actividades Soportadas**
- ✅ Cliente creado
- ✅ Cliente actualizado
- ✅ Contacto creado
- ✅ Contacto actualizado
- ✅ Oportunidad creada
- ✅ Oportunidad actualizada
- ✅ Cambio de etapa en oportunidad
- ✅ Reunión programada
- ✅ Reunión completada
- ✅ Nota agregada
- ✅ Email enviado
- ✅ Llamada realizada
- ✅ Tarea creada
- ✅ Tarea completada
- ✅ Archivo subido
- ✅ Cambio de estado
- ✅ Otras actividades

#### 3. **Características del Timeline**
- **Iconos distintivos** por tipo de actividad
- **Colores diferenciados** para cada tipo
- **Timestamps relativos** (hace X minutos/horas/días)
- **Metadata adicional** en formato JSON
- **Información del usuario** que realizó la actividad
- **Línea de tiempo visual** conectando las actividades
- **Ordenamiento cronológico** (más reciente primero)

#### 4. **Hook para Registrar Actividades**
- Hook `useActivityLog` ubicado en `src/hooks/useActivityLog.ts`
- Uso simple:
```typescript
const { logActivity } = useActivityLog();

await logActivity({
    activityType: 'client_created',
    title: 'Cliente "Acme Corp" creado',
    description: 'Se ha creado un nuevo cliente en el sistema',
    clientId: clientId,
    relatedToType: 'client',
    relatedToId: clientId,
    metadata: {
        client_name: 'Acme Corp',
        source: 'manual_creation'
    }
});
```

### Base de Datos

#### Nueva tabla `activity_log`:
```sql
CREATE TABLE activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    activity_type TEXT NOT NULL,
    related_to_type TEXT,
    related_to_id UUID,
    client_id UUID,
    title TEXT NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

#### Índices para rendimiento:
- `idx_activity_log_tenant_id`
- `idx_activity_log_client_id`
- `idx_activity_log_created_at`
- `idx_activity_log_activity_type`
- `idx_activity_log_related_to`

#### Políticas RLS:
- Los usuarios solo pueden ver actividades de su tenant
- Los usuarios pueden crear actividades en su tenant

---

## 📖 Cómo Usar

### Para Usuarios

#### Editar tu Perfil:
1. Ve a **Configuración** (`/settings` o `/profile`)
2. Haz clic en tu avatar para cambiar la foto
3. Edita tus datos personales
4. Haz clic en **Guardar Cambios**

#### Ver Historial de un Cliente:
1. Ve a **Clientes** (`/clients`)
2. Haz clic en un cliente para ver su **Ficha 360**
3. Desplázate hasta la sección **Historial de Actividad**
4. Verás todas las interacciones registradas con ese cliente

### Para Administradores

#### Crear un Nuevo Usuario:
1. Ve a **Configuración** → pestaña **Usuarios**
2. Haz clic en **Nuevo Usuario**
3. Completa el formulario:
   - Email (será el username)
   - Contraseña (mínimo 6 caracteres)
   - Nombre completo
   - Rol
   - Datos opcionales (teléfono, cargo, ubicación)
4. Haz clic en **Crear Usuario**

#### Editar un Usuario:
1. Ve a **Configuración** → pestaña **Usuarios**
2. Haz clic en el ícono de editar (✏️) del usuario
3. Modifica los datos necesarios
4. Haz clic en **Guardar Cambios**

#### Activar/Desactivar un Usuario:
1. Ve a **Configuración** → pestaña **Usuarios**
2. Haz clic en el toggle de estado del usuario
3. El cambio se aplicará inmediatamente

### Para Desarrolladores

#### Registrar una Actividad:
```typescript
import { useActivityLog } from '../hooks/useActivityLog';

function MyComponent() {
    const { logActivity } = useActivityLog();

    const handleSomeAction = async () => {
        // ... tu lógica ...

        // Registrar la actividad
        await logActivity({
            activityType: 'opportunity_created',
            title: 'Nueva oportunidad creada',
            description: 'Oportunidad de $50,000',
            clientId: clientId,
            relatedToType: 'opportunity',
            relatedToId: opportunityId,
            metadata: {
                value: 50000,
                stage: 'prospecting'
            }
        });
    };

    return <div>...</div>;
}
```

Ver más ejemplos en: `src/examples/ActivityLogExamples.tsx`

---

## ✅ Fase 3: Sistema de Chat con Discord

### Funcionalidades Implementadas

#### 1. **Chat Flotante Integrado**
- Componente `DiscordChat` ubicado en `src/components/chat/DiscordChat.tsx`
- Botón flotante en la esquina inferior derecha
- Chat minimizable y maximizable
- Integración completa con Discord mediante Webhooks

#### 2. **Características del Chat**
- **Envío de mensajes** en tiempo real a Discord
- **Avatar y nombre del usuario** en cada mensaje
- **Interfaz moderna** con diseño glassmorphism
- **Minimizar/Maximizar** para no interrumpir el trabajo
- **Botón de canal de voz** para unirse a llamadas de equipo
- **Enlace directo** al canal de Discord

#### 3. **Notificaciones Automáticas a Discord**
El servicio `discordService` envía notificaciones automáticas cuando:
- 💰 **Nueva oportunidad creada** - Con valor estimado y cliente
- 📊 **Cambio de etapa en oportunidad** - Con etapas anterior y nueva
- 🎉 **Nuevo cliente registrado** - Con industria y datos básicos
- 📅 **Reunión programada** - Con fecha y cliente
- ✅ **Tarea completada** - Con título y cliente

#### 4. **Servicio de Discord**
- Servicio `discordService` ubicado en `src/services/discord.ts`
- Métodos disponibles:
  - `sendMessage()` - Enviar mensaje simple
  - `sendEmbed()` - Enviar mensaje enriquecido con formato
  - `notifyNewOpportunity()` - Notificar nueva oportunidad
  - `notifyOpportunityStageChange()` - Notificar cambio de etapa
  - `notifyNewClient()` - Notificar nuevo cliente
  - `notifyMeetingScheduled()` - Notificar reunión programada
  - `notifyTaskCompleted()` - Notificar tarea completada
  - `sendChatMessage()` - Enviar mensaje de chat con avatar
  - `getVoiceChannelInvite()` - Obtener enlace al canal de voz
  - `getTextChannelInvite()` - Obtener enlace al canal de texto

### Configuración

#### Variables de Entorno Requeridas:
```bash
VITE_DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
VITE_DISCORD_BOT_TOKEN=tu_bot_token (opcional)
VITE_DISCORD_GUILD_ID=123456789012345678
VITE_DISCORD_CHANNEL_ID=123456789012345678
VITE_DISCORD_VOICE_CHANNEL_ID=123456789012345678
```

#### Guía Completa de Configuración:
Ver `DISCORD_SETUP.md` para instrucciones detalladas paso a paso sobre:
- Crear una aplicación de Discord
- Configurar webhooks
- Obtener IDs necesarios
- Configurar variables de entorno
- Solución de problemas

### Uso del Chat

#### Para Usuarios:
1. Haz clic en el botón flotante de chat (💬) en la esquina inferior derecha
2. Escribe tu mensaje en el campo de texto
3. Presiona Enter o haz clic en el botón de enviar
4. El mensaje aparecerá en Discord para todo el equipo

#### Unirse al Canal de Voz:
1. Abre el chat
2. Haz clic en el botón de teléfono (📞) en el header
3. Se abrirá Discord con el canal de voz seleccionado

### Uso de Notificaciones (Desarrolladores)

#### Ejemplo: Notificar Nueva Oportunidad
```typescript
import { discordService } from '../services/discord';

const handleCreateOpportunity = async (opportunity) => {
    // ... crear oportunidad ...
    
    // Notificar a Discord
    await discordService.notifyNewOpportunity(
        opportunity.title,
        client.name,
        opportunity.value,
        user.full_name
    );
};
```

#### Ejemplo: Notificar Cambio de Etapa
```typescript
import { discordService } from '../services/discord';

const handleStageChange = async (opportunityId, newStage) => {
    // ... actualizar etapa ...
    
    // Notificar a Discord
    await discordService.notifyOpportunityStageChange(
        opportunity.title,
        client.name,
        oldStage,
        newStage,
        user.full_name
    );
};
```

#### Ejemplo: Mensaje Personalizado
```typescript
import { discordService } from '../services/discord';

await discordService.sendEmbed({
    title: '🎯 Evento Personalizado',
    description: 'Descripción del evento',
    color: 0x9333EA, // Púrpura
    fields: [
        { name: 'Campo 1', value: 'Valor 1', inline: true },
        { name: 'Campo 2', value: 'Valor 2', inline: true }
    ],
    timestamp: new Date().toISOString(),
    footer: { text: 'Neuracall CRM' }
});
```

### Personalización

#### Colores de Notificaciones:
Los colores se definen en formato hexadecimal:
- Verde: `0x10B981` (éxito, nuevo cliente)
- Azul: `0x3B82F6` (información, cambios)
- Púrpura: `0x9333EA` (oportunidades)
- Rojo: `0xEF4444` (alertas, errores)
- Amarillo: `0xF59E0B` (advertencias)
- Cyan: `0x06B6D4` (reuniones, eventos)

#### Agregar Nuevos Tipos de Notificaciones:
1. Abre `src/services/discord.ts`
2. Agrega un nuevo método siguiendo el patrón existente
3. Usa el método en tus componentes

### Características Técnicas

#### Seguridad:
- Las credenciales de Discord se almacenan en variables de entorno
- El archivo `.env` está en `.gitignore`
- Los webhooks son de solo escritura (no exponen datos)
- Los mensajes incluyen el contexto del usuario autenticado

#### Rendimiento:
- Envío asíncrono de notificaciones (no bloquea la UI)
- Manejo de errores silencioso (no interrumpe la experiencia del usuario)
- Logs en consola para debugging

#### Integración:
- El chat está disponible en toda la aplicación
- Solo se muestra si Discord está configurado
- Compatible con todos los navegadores modernos

---

## ✅ Fase 4: Integración de Activity Logging en Módulos Core

### Objetivo
Integrar el sistema de registro de actividades (`useActivityLog`) y las notificaciones de Discord en los modales principales del CRM para automatizar el seguimiento de acciones importantes.

### Módulos Integrados

#### 1. **ClientModal** - Gestión de Clientes
**Ubicación:** `src/components/clients/ClientModal.tsx`

**Actividades Registradas:**
- `client_created` - Al crear un nuevo cliente
- `client_updated` - Al actualizar datos de un cliente

**Notificaciones Discord:**
- 🟢 **Nuevo Cliente** - Incluye nombre, industria y usuario creador

**Metadata Guardada:**
```typescript
{
    company_name: string | null,
    industry: string | null,
    source: string | null,
    converted_from_prospect: boolean
}
```

#### 2. **OpportunityModal** - Gestión de Oportunidades
**Ubicación:** `src/components/opportunities/OpportunityModal.tsx`

**Actividades Registradas:**
- `opportunity_created` - Al crear una nueva oportunidad
- `opportunity_updated` - Al actualizar una oportunidad
- `opportunity_stage_changed` - Al cambiar la etapa de una oportunidad

**Notificaciones Discord:**
- 🟣 **Nueva Oportunidad** - Incluye título, cliente, valor y usuario
- 🔵 **Cambio de Etapa** - Incluye etapa anterior, nueva etapa y detalles

**Metadata Guardada:**
```typescript
{
    value: number,
    status: string,
    probability: number,
    expected_close_date: string | null,
    old_stage?: string,  // Solo en cambio de etapa
    new_stage?: string   // Solo en cambio de etapa
}
```

#### 3. **TaskModal** - Gestión de Tareas
**Ubicación:** `src/components/tasks/TaskModal.tsx`

**Actividades Registradas:**
- `task_created` - Al crear una nueva tarea
- `task_completed` - Al completar una tarea
- `other` - Al actualizar una tarea (sin completar)

**Notificaciones Discord:**
- ✅ **Tarea Completada** - Incluye título, cliente y usuario

**Metadata Guardada:**
```typescript
{
    status: string,
    priority: string,
    due_date: string | null,
    assigned_to?: string  // Solo en creación
}
```

#### 4. **EventModal** - Gestión de Reuniones
**Ubicación:** `src/components/calendar/EventModal.tsx`

**Actividades Registradas:**
- `meeting_scheduled` - Al programar una reunión
- `meeting_completed` - Al completar una reunión

**Notificaciones Discord:**
- 📅 **Reunión Programada** - Incluye título, cliente, fecha/hora y usuario

**Metadata Guardada:**
```typescript
{
    event_type: string,
    start_date: string,
    location: string | null,
    attendees: string[]
}
```

### Características de la Integración

#### Registro Automático
- Todas las acciones se registran automáticamente sin intervención del usuario
- El sistema captura el contexto completo (usuario, cliente, timestamp)
- La metadata se guarda en formato JSON para análisis futuro

#### Notificaciones Inteligentes
- Solo se envían notificaciones para eventos importantes
- Las notificaciones incluyen toda la información relevante
- Formato enriquecido con colores y emojis distintivos
- Timestamp automático en cada notificación

#### Visualización en Timeline
- Todas las actividades aparecen en la Ficha 360 del cliente
- Iconos y colores distintivos por tipo de actividad
- Timestamps relativos (hace X minutos/horas/días)
- Metadata expandible para ver detalles completos

### Beneficios

1. **Trazabilidad Completa**
   - Historial completo de todas las acciones realizadas
   - Identificación clara de quién hizo qué y cuándo
   - Metadata enriquecida para análisis

2. **Comunicación en Tiempo Real**
   - El equipo se mantiene informado vía Discord
   - Notificaciones instantáneas de eventos importantes
   - Contexto completo en cada notificación

3. **Mejora en la Colaboración**
   - Visibilidad compartida de actividades
   - Reducción de duplicación de esfuerzos
   - Mejor coordinación del equipo

4. **Análisis y Reportes**
   - Datos estructurados para generar reportes
   - Identificación de patrones y tendencias
   - Base para métricas de rendimiento

### Documentación Adicional

Para más detalles sobre la integración, consulta:
- **Resumen Completo**: `INTEGRATION_SUMMARY.md`
- **Configuración de Discord**: `DISCORD_SETUP.md`
- **Ejemplos de Uso**: `src/examples/ActivityLogExamples.tsx`

---

## 📝 Notas Técnicas

### Seguridad
- Todas las operaciones están protegidas por RLS (Row Level Security)
- Los usuarios solo pueden acceder a datos de su tenant
- Las fotos de perfil se almacenan en rutas específicas por usuario
- Las contraseñas se manejan a través de Supabase Auth

### Rendimiento
- Índices optimizados para consultas rápidas
- Límite de 100 actividades en el timeline (paginación futura)
- Carga lazy de avatares
- Timestamps relativos calculados en el cliente

### Mantenimiento
- Logs de errores en consola para debugging
- Mensajes de éxito/error claros para el usuario
- Validación de formularios en frontend y backend
- Tipos TypeScript completos para type safety

---

## 🐛 Troubleshooting

### No puedo subir mi foto de perfil
- Verifica que la imagen sea menor a 5MB
- Asegúrate de usar un formato soportado (JPG, PNG, WebP, GIF)
- Revisa la consola del navegador para ver errores específicos

### No veo el historial de actividades
- Verifica que estés viendo la Ficha 360 de un cliente
- Las actividades se registran automáticamente cuando se realizan acciones
- Si no hay actividades, el timeline mostrará "No hay actividades registradas"

### No puedo crear usuarios
- Solo los usuarios con rol Founder o Admin pueden crear usuarios
- Verifica que el email no esté ya registrado
- La contraseña debe tener al menos 6 caracteres

---

## 📚 Recursos

- [Documentación de Supabase Storage](https://supabase.com/docs/guides/storage)
- [Documentación de Supabase Auth](https://supabase.com/docs/guides/auth)
- [Documentación de RLS](https://supabase.com/docs/guides/auth/row-level-security)
