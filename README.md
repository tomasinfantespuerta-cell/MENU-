# Comidas de casa

PWA para organizar las comidas de casa entre varias personas: **menú semanal**,
**lista de la compra** y **recetario**, sincronizados en tiempo real y usables
sin conexión.

- React + Vite + Tailwind · instalable como PWA
- Supabase (Postgres + Realtime + Storage) · sin registro: acceso por «código de casa»
- Caché local en IndexedDB con cola de cambios pendientes (offline-first)

**Puesta en marcha y despliegue:** [docs/DESPLIEGUE.md](docs/DESPLIEGUE.md)

## Scripts

```bash
npm run dev        # desarrollo
npm test           # pruebas (Vitest)
npm run build      # compilación de producción
```

## Estructura

```
supabase/migrations/   SQL de tablas, permisos (RLS), funciones y tiempo real
src/sync/              motor de sincronización offline (genérico para todas las tablas)
  engine.ts            cola de cambios, envío, descarga y mezcla
  order.ts             orden estable con fractional indexing
  supabaseRemote.ts    acceso a Supabase
  fakeRemote.ts        servidor simulado (pruebas y modo demo)
src/features/shopping/ lista de la compra
src/household/         código de casa (crear / unirse)
```

## Estado

- [x] Fase 1: base, PWA, código de casa, sincronización offline y lista de la compra
- [x] Fase 2: recetario (15 recetas iniciales, buscador, filtros, fotos)
- [x] Fase 3: menú semanal (historial, copiar semana)
- [x] Pestaña «Yo» (menú y compra personales, activable por móvil)
- [x] Recetas saludables e «Ideas de la semana» (80 saludables + 40 familiares que rotan cada lunes)
- [ ] Fase 4: pulido
