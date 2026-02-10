# Configuración de Branding - Neuracall CRM

## Logo de la Aplicación

Para cambiar el logo de la aplicación, actualiza la siguiente variable de entorno:

### En `.env`
```env
# URL del logo (puede ser una ruta local o una URL externa)
VITE_LOGO_URL=/neuracall-logo.png

# Nombre de la aplicación
VITE_APP_NAME=Neuracall CRM

# Descripción de la aplicación
VITE_APP_DESCRIPTION=Gestiona tu negocio de forma inteligente
```

## Opciones para el Logo

### Opción 1: Logo Local (Recomendado)
Coloca tu logo en la carpeta `public/` y usa la ruta relativa:
```env
VITE_LOGO_URL=/mi-logo.png
```

### Opción 2: Logo desde URL Externa
Usa una URL completa:
```env
VITE_LOGO_URL=https://mi-dominio.com/logo.png
```

### Opción 3: Logo desde Supabase Storage
Si subes el logo a Supabase Storage:
```env
VITE_LOGO_URL=https://tgdiveflqlzedzdbxbvd.supabase.co/storage/v1/object/public/logos/mi-logo.png
```

## Formatos Recomendados

- **Formato:** PNG con fondo transparente
- **Tamaño:** 512x512px (cuadrado)
- **Peso:** Menos de 100KB
- **Colores:** Que contrasten bien con fondo oscuro

## Aplicar Cambios

1. Actualiza el `.env` con la nueva URL del logo
2. Reinicia el servidor de desarrollo:
   ```bash
   # Ctrl+C para detener
   npm run dev
   ```
3. Recarga la página en el navegador

## Ejemplo Completo

```env
# Supabase
VITE_SUPABASE_URL=https://tgdiveflqlzedzdbxbvd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Branding
VITE_LOGO_URL=/neuracall-logo.png
VITE_APP_NAME=Neuracall CRM
VITE_APP_DESCRIPTION=Gestiona tu negocio de forma inteligente
```

**Última actualización:** 2026-02-10 16:35
