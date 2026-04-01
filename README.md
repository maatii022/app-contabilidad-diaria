# App Contabilidad Diaria

Starter inicial de la web app móvil para leer y analizar gastos e ingresos personales con una interfaz oscura, compacta y premium.

## Qué incluye esta base

- Next.js con App Router y TypeScript.
- Tailwind CSS v4 con configuración mínima.
- Estructura de páginas real para:
  - `/resumen`
  - `/movimientos`
  - `/analisis`
  - `/presupuesto`
- Sistema visual mobile first.
- Modelo base de datos para Supabase.
- Repositorio de datos con fallback:
  - si configuras Supabase, lee desde base de datos,
  - si no, usa datos mock para arrancar sin bloqueo.

## Instalación

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Variables de entorno

Rellena `.env.local` con:

```bash
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
APP_TIMEZONE=Europe/Madrid
APP_DEFAULT_CURRENCY=EUR
```

## Orden recomendado para seguir

### 1. Crear proyecto en Supabase
- Crea un proyecto nuevo.
- Ejecuta `supabase/schema.sql` en el SQL Editor.

### 2. Validar esta base visual
- Arranca la app.
- Revisa la navegación.
- Ajusta densidad, tamaños y jerarquía si hace falta.

### 3. Conectar datos reales
La app ya está preparada para leer desde Supabase. El siguiente paso es construir la sincronización desde Google Sheets.

### 4. Próxima fase
- Endpoint de lectura en Apps Script o sincronizador desde Google Drive.
- Ingesta de transacciones reales.
- Ingesta de presupuestos mensuales.
- Sustitución total del mock.

## Decisión de arquitectura

La captura sigue entrando por iPhone y Apps Script. Google Sheets mantiene la verdad de entrada y Supabase se usa como capa de lectura rápida para producto.

Flujo previsto:

Atajos de iPhone → Apps Script → Google Sheets → sincronización → Supabase → Next.js

## Qué no hace todavía

- No hay login.
- No hay sincronización real con Google Sheets.
- No hay edición manual de movimientos.
- El saldo inicial sigue mockeado en el repositorio mientras no creemos la tabla o lógica mensual correspondiente.

## Notas de producto

- La home no está enfocada en registrar datos.
- El foco está en entender rápido el mes.
- La navegación inferior está pensada para móvil desde el inicio.
