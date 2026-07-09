# 🧀 Quesería La Granja — Gestión Financiera

MVP SaaS de gestión financiera para una quesería en Chile.
Estética premium (Apple-commercial), IVA 19%, KPIs en vivo y módulo de tributación SII (F29).

**App en vivo:** https://sudamerica-ai.github.io/queseria-la-granja/

## Stack
- React 18 + Tailwind, pre-bundleado con esbuild en un único `index.html` autónomo.
- Fuente editable en `build/app.jsx`. Recompilar:
  `cd build && ./node_modules/.bin/esbuild app.jsx --bundle --minify --format=iife --jsx=automatic --define:process.env.NODE_ENV='"production"' --outfile=bundle.js`

## Módulos
Dashboard · Inventario y Precios · Ventas · Compras y Gastos · Impuestos (SII) · Configuración
