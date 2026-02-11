# Guía de Configuración de Discord para Neuracall CRM

## 📋 Requisitos Previos
- Una cuenta de Discord
- Permisos de administrador en un servidor de Discord (o crear uno nuevo)

## 🚀 Paso 1: Crear una Aplicación de Discord

1. Ve a [Discord Developer Portal](https://discord.com/developers/applications)
2. Haz clic en **"New Application"**
3. Dale un nombre a tu aplicación (ej: "Neuracall CRM")
4. Acepta los términos de servicio
5. Haz clic en **"Create"**

## 🔧 Paso 2: Configurar el Webhook

### Opción A: Crear un Webhook en un Canal Existente

1. Abre Discord y ve a tu servidor
2. Haz clic derecho en el canal donde quieres recibir mensajes
3. Selecciona **"Editar Canal"** → **"Integraciones"** → **"Webhooks"**
4. Haz clic en **"Nuevo Webhook"**
5. Dale un nombre (ej: "CRM Notifications")
6. **Copia la URL del Webhook** (la necesitarás para el archivo `.env`)

### Opción B: Crear un Webhook desde el Developer Portal

1. En el [Discord Developer Portal](https://discord.com/developers/applications)
2. Selecciona tu aplicación
3. Ve a **"Bot"** en el menú lateral
4. Haz clic en **"Add Bot"**
5. Confirma haciendo clic en **"Yes, do it!"**
6. En la sección **"Token"**, haz clic en **"Copy"** para copiar el token del bot
   - ⚠️ **IMPORTANTE**: Nunca compartas este token públicamente

## 📝 Paso 3: Obtener IDs Necesarios

### Habilitar el Modo Desarrollador en Discord

1. Abre Discord
2. Ve a **Configuración de Usuario** (⚙️)
3. Ve a **Avanzado** → **Modo de desarrollador**
4. Activa el **Modo de desarrollador**

### Obtener el ID del Servidor (Guild ID)

1. Haz clic derecho en el nombre de tu servidor
2. Selecciona **"Copiar ID del servidor"**
3. Guarda este ID (lo necesitarás para `VITE_DISCORD_GUILD_ID`)

### Obtener el ID del Canal de Texto

1. Haz clic derecho en el canal de texto donde quieres el chat
2. Selecciona **"Copiar ID del canal"**
3. Guarda este ID (lo necesitarás para `VITE_DISCORD_CHANNEL_ID`)

### Obtener el ID del Canal de Voz

1. Haz clic derecho en el canal de voz que quieres usar
2. Selecciona **"Copiar ID del canal"**
3. Guarda este ID (lo necesitarás para `VITE_DISCORD_VOICE_CHANNEL_ID`)

## 🔐 Paso 4: Configurar Variables de Entorno

1. Copia el archivo `.env.example` a `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edita el archivo `.env` y agrega tus credenciales de Discord:
   ```bash
   # Discord Integration
   VITE_DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/123456789/abcdefghijklmnop
   VITE_DISCORD_BOT_TOKEN=tu_bot_token_aqui
   VITE_DISCORD_GUILD_ID=123456789012345678
   VITE_DISCORD_CHANNEL_ID=123456789012345678
   VITE_DISCORD_VOICE_CHANNEL_ID=123456789012345678
   ```

3. **Guarda el archivo** y **NO lo subas a Git** (ya está en `.gitignore`)

## ✅ Paso 5: Verificar la Configuración

1. Reinicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

2. Abre la aplicación en tu navegador

3. Deberías ver un botón flotante de chat en la esquina inferior derecha

4. Haz clic en el botón para abrir el chat

5. Envía un mensaje de prueba

6. Verifica que el mensaje aparezca en tu canal de Discord

## 🎯 Funcionalidades Disponibles

### Chat en Tiempo Real
- Envía mensajes desde el CRM que aparecen en Discord
- Los mensajes incluyen el nombre y avatar del usuario
- Todos los miembros del equipo pueden ver los mensajes en Discord

### Notificaciones Automáticas
El sistema enviará notificaciones automáticas a Discord cuando:
- ✅ Se crea un nuevo cliente
- ✅ Se crea una nueva oportunidad
- ✅ Cambia la etapa de una oportunidad
- ✅ Se programa una reunión
- ✅ Se completa una tarea

### Canal de Voz
- Botón para unirse al canal de voz directamente desde el CRM
- Abre Discord en una nueva pestaña con el canal de voz seleccionado

## 🔧 Personalización Avanzada

### Cambiar el Color de las Notificaciones

Edita el archivo `src/services/discord.ts` y modifica los valores de `color` en cada método:

```typescript
// Ejemplo: Cambiar el color de nuevas oportunidades
async notifyNewOpportunity(...) {
    return this.sendEmbed({
        ...
        color: 0x9333EA, // Cambiar este valor hexadecimal
        ...
    });
}
```

Colores sugeridos:
- Verde: `0x10B981`
- Azul: `0x3B82F6`
- Púrpura: `0x9333EA`
- Rojo: `0xEF4444`
- Amarillo: `0xF59E0B`

### Agregar Nuevos Tipos de Notificaciones

1. Abre `src/services/discord.ts`
2. Agrega un nuevo método siguiendo el patrón existente:

```typescript
async notifyCustomEvent(
    title: string,
    description: string,
    fields: Array<{ name: string; value: string; inline?: boolean }>
): Promise<boolean> {
    return this.sendEmbed({
        title: `🎯 ${title}`,
        description: description,
        color: 0x3B82F6,
        fields: fields,
        timestamp: new Date().toISOString(),
        footer: {
            text: 'Neuracall CRM'
        }
    });
}
```

3. Usa el nuevo método en tu código:

```typescript
import { discordService } from '../services/discord';

await discordService.notifyCustomEvent(
    'Evento Personalizado',
    'Descripción del evento',
    [
        { name: 'Campo 1', value: 'Valor 1', inline: true },
        { name: 'Campo 2', value: 'Valor 2', inline: true }
    ]
);
```

## 🐛 Solución de Problemas

### El botón de chat no aparece
- Verifica que `VITE_DISCORD_WEBHOOK_URL` esté configurado en `.env`
- Reinicia el servidor de desarrollo
- Limpia la caché del navegador

### Los mensajes no llegan a Discord
- Verifica que la URL del webhook sea correcta
- Asegúrate de que el webhook no haya sido eliminado en Discord
- Revisa la consola del navegador para ver errores

### El canal de voz no se abre
- Verifica que `VITE_DISCORD_GUILD_ID` y `VITE_DISCORD_VOICE_CHANNEL_ID` sean correctos
- Asegúrate de tener permisos para acceder al canal de voz
- Verifica que el canal de voz no esté eliminado

### Las notificaciones no se envían automáticamente
- Las notificaciones se enviarán cuando implementes el hook en tus componentes
- Ver `FEATURES.md` para ejemplos de cómo integrar notificaciones

## 📚 Recursos Adicionales

- [Documentación oficial de Discord Webhooks](https://discord.com/developers/docs/resources/webhook)
- [Guía de Discord Bot](https://discord.com/developers/docs/topics/oauth2#bots)
- [Discord Developer Portal](https://discord.com/developers/applications)

## 🔒 Seguridad

⚠️ **IMPORTANTE**:
- Nunca compartas tu token de bot públicamente
- No subas el archivo `.env` a Git
- Regenera el token si crees que ha sido comprometido
- Usa variables de entorno en producción (Vercel, Netlify, etc.)

## 📞 Soporte

Si tienes problemas con la configuración:
1. Revisa esta guía paso a paso
2. Verifica los logs en la consola del navegador
3. Consulta la documentación oficial de Discord
