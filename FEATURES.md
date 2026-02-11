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

## 🚀 Próximos Pasos (Fase 3)

### Sistema de Chat con Discord
- Integración con Discord API
- Canales de voz para el equipo
- Chat en tiempo real
- Notificaciones de actividades importantes

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
