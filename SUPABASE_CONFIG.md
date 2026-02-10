# Configuración de Supabase - Neuracall CRM

## ✅ Configuración Correcta y Sincronizada

Este proyecto usa Supabase para la base de datos. Ambas configuraciones están sincronizadas:

### 1. Variables de Entorno (.env)
```env
VITE_SUPABASE_URL=https://tgdiveflqlzedzdbxbvd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnZGl2ZWZscWx6ZWR6ZGJ4YnZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2ODYxNzEsImV4cCI6MjA4NjI2MjE3MX0.6yRT0WX52PEVrXXkMA_hDP1H-WslHVqKEoFMh2tWr-Y
```

**Project Ref:** `tgdiveflqlzedzdbxbvd` ✅

### 2. MCP de Supabase (~/.gemini/antigravity/mcp_config.json)

```json
{
  "supabase-mcp-server": {
    "command": "npx",
    "args": [
      "-y",
      "@supabase/mcp-server-supabase@latest",
      "--access-token",
      "sbp_054dcebbb8d2727e728aa3b788cb685119a67ee2",
      "--project-ref",
      "tgdiveflqlzedzdbxbvd"
    ]
  }
}
```

**Project Ref:** `tgdiveflqlzedzdbxbvd` ✅

## 🎯 Todo Sincronizado

Ambas configuraciones apuntan al mismo proyecto de Supabase. Ahora puedes trabajar tranquilo.

## 📝 Información del Proyecto

- **URL:** `https://tgdiveflqlzedzdbxbvd.supabase.co`
- **Project Ref:** `tgdiveflqlzedzdbxbvd`
- **Access Token:** `sbp_054dcebbb8d2727e728aa3b788cb685119a67ee2`
- **Anon Key:** Ver `.env`

## 🔄 Cambiar a Otro Proyecto

Si necesitas cambiar a otro proyecto de Supabase:

1. **Actualiza `.env`:**
   ```env
   VITE_SUPABASE_URL=https://nuevo-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=nueva-anon-key
   ```

2. **Actualiza `~/.gemini/antigravity/mcp_config.json`:**
   ```json
   "project-ref": "nuevo-proyecto"
   ```

3. **Reinicia el servidor:**
   ```bash
   # Ctrl+C para detener
   npm run dev
   ```

## 🧪 Verificar Conexión

### Test desde la app:
```bash
npm run dev
# Abre http://localhost:5173 y prueba hacer login
```

### Test del MCP:
Pídele al asistente:
```
Lista las tablas de la base de datos usando el MCP de Supabase
```

**Última actualización:** 2026-02-10 16:34
**Estado:** ✅ Configuración sincronizada y funcionando
