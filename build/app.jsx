
    import React, { useState, useMemo } from "react";
import ReactDOM from "react-dom/client";

    /* ============================================================
       CONSTANTES DE NEGOCIO (Chile)
       ============================================================ */
    const IVA = 0.19; // 19% Chile

    /* ============================================================
       JSON MAESTRO — datos de prueba realistas (Quesería La Granja)
       Todos los montos base se guardan en NETO (sin IVA).
       ============================================================ */
    const DB = {
      empresa: {
        nombre: "Quesería La Granja",
        rut: "76.845.210-3",
        giro: "Elaboración y venta de quesos",
        comuna: "Osorno, Región de Los Lagos",
        periodo: "Junio 2026",
      },
      // Catálogo de quesos — costo y precio en NETO
      productos: [
        { id: "P01", nombre: "Queso Mantecoso",  formato: "Kg", costoNeto: 5200, precioNeto: 8900,  stock: 42, loteUnidades: 120, emoji: "🧀" },
        { id: "P02", nombre: "Queso Gauda",       formato: "Kg", costoNeto: 4800, precioNeto: 7900,  stock: 68, loteUnidades: 150, emoji: "🧀" },
        { id: "P03", nombre: "Queso de Cabra",    formato: "Kg", costoNeto: 7100, precioNeto: 12500, stock: 18, loteUnidades: 60,  emoji: "🐐" },
        { id: "P04", nombre: "Queso Chanco",      formato: "Kg", costoNeto: 4500, precioNeto: 7200,  stock: 55, loteUnidades: 140, emoji: "🧀" },
        { id: "P05", nombre: "Queso Ricotta",     formato: "Kg", costoNeto: 3200, precioNeto: 5600,  stock: 24, loteUnidades: 80,  emoji: "🥛" },
        { id: "P06", nombre: "Queso Azul Reserva",formato: "Kg", costoNeto: 9800, precioNeto: 16900, stock: 9,  loteUnidades: 40,  emoji: "🫕" },
      ],
      // Ventas del período — precioNeto unitario congelado al momento de la venta
      ventas: [
        { id: "V001", fecha: "2026-06-03", productoId: "P02", cantidad: 12, precioNetoUnit: 7900 },
        { id: "V002", fecha: "2026-06-05", productoId: "P01", cantidad: 8,  precioNetoUnit: 8900 },
        { id: "V003", fecha: "2026-06-07", productoId: "P03", cantidad: 5,  precioNetoUnit: 12500 },
        { id: "V004", fecha: "2026-06-09", productoId: "P04", cantidad: 20, precioNetoUnit: 7200 },
        { id: "V005", fecha: "2026-06-12", productoId: "P06", cantidad: 3,  precioNetoUnit: 16900 },
        { id: "V006", fecha: "2026-06-14", productoId: "P02", cantidad: 15, precioNetoUnit: 7900 },
        { id: "V007", fecha: "2026-06-16", productoId: "P05", cantidad: 10, precioNetoUnit: 5600 },
        { id: "V008", fecha: "2026-06-18", productoId: "P01", cantidad: 14, precioNetoUnit: 8900 },
        { id: "V009", fecha: "2026-06-21", productoId: "P03", cantidad: 7,  precioNetoUnit: 12500 },
        { id: "V010", fecha: "2026-06-24", productoId: "P04", cantidad: 18, precioNetoUnit: 7200 },
        { id: "V011", fecha: "2026-06-26", productoId: "P02", cantidad: 22, precioNetoUnit: 7900 },
        { id: "V012", fecha: "2026-06-28", productoId: "P06", cantidad: 4,  precioNetoUnit: 16900 },
      ],
      // Compras y gastos — montoNeto; conIVA indica si genera IVA Crédito
      gastos: [
        { id: "G001", fecha: "2026-06-02", categoria: "Insumo",   descripcion: "Leche cruda (proveedor local)", montoNeto: 1850000, conIVA: true },
        { id: "G002", fecha: "2026-06-02", categoria: "Insumo",   descripcion: "Cuajo y fermentos lácticos",     montoNeto: 320000,  conIVA: true },
        { id: "G003", fecha: "2026-06-05", categoria: "Servicio", descripcion: "Electricidad (planta frío)",     montoNeto: 480000,  conIVA: true },
        { id: "G004", fecha: "2026-06-05", categoria: "Servicio", descripcion: "Agua potable",                   montoNeto: 145000,  conIVA: true },
        { id: "G005", fecha: "2026-06-10", categoria: "Insumo",   descripcion: "Sal de maduración y envases",    montoNeto: 210000,  conIVA: true },
        { id: "G006", fecha: "2026-06-30", categoria: "Sueldo",   descripcion: "Remuneraciones (3 operarios)",   montoNeto: 2400000, conIVA: false },
        { id: "G007", fecha: "2026-06-01", categoria: "Arriendo", descripcion: "Arriendo planta y bodega",       montoNeto: 750000,  conIVA: false },
        { id: "G008", fecha: "2026-06-15", categoria: "Servicio", descripcion: "Transporte y distribución",      montoNeto: 380000,  conIVA: true },
      ],
    };

    /* ============================================================
       UTILIDADES
       ============================================================ */
    const CLP = (n) =>
      new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(Math.round(n || 0));
    const pct = (n) => `${(n * 100).toFixed(1)}%`;
    const bruto = (neto) => neto * (1 + IVA);
    const ivaDe  = (neto) => neto * IVA;

    /* ============================================================
       MOTOR FINANCIERO — todos los KPI derivan de aquí, en vivo
       ============================================================ */
    function useFinanzas() {
      return useMemo(() => {
        // --- Ventas ---
        const ventasNeto = DB.ventas.reduce((s, v) => s + v.precioNetoUnit * v.cantidad, 0);
        const ivaDebito  = ventasNeto * IVA;                 // IVA Débito (ventas)
        const ventasBruto = ventasNeto + ivaDebito;
        const unidadesVendidas = DB.ventas.reduce((s, v) => s + v.cantidad, 0);
        const ticketPromedio = ventasBruto / DB.ventas.length;

        // --- Compras / gastos ---
        const gastosNeto = DB.gastos.reduce((s, g) => s + g.montoNeto, 0);
        const ivaCredito = DB.gastos.filter(g => g.conIVA).reduce((s, g) => s + g.montoNeto * IVA, 0);
        const gastosBruto = DB.gastos.reduce((s, g) => s + (g.conIVA ? bruto(g.montoNeto) : g.montoNeto), 0);

        // --- Costo variable de lo vendido (COGS neto) ---
        const cogsNeto = DB.ventas.reduce((s, v) => {
          const p = DB.productos.find(x => x.id === v.productoId);
          return s + (p ? p.costoNeto * v.cantidad : 0);
        }, 0);

        // --- Impuesto SII (a pagar el día 20) ---
        const ivaAPagar = Math.max(0, ivaDebito - ivaCredito);
        const remanenteCredito = Math.max(0, ivaCredito - ivaDebito);

        // --- Utilidad neta mensual ---
        // Ingresos Brutos − (Costos variables + Gastos fijos + Impuesto)
        const utilidadNeta = ventasBruto - (cogsNeto + gastosBruto + ivaAPagar);

        // --- Margen de contribución por producto ---
        const margenes = DB.productos.map(p => ({
          ...p,
          margenUnit: p.precioNeto - p.costoNeto,
          margenPct: (p.precioNeto - p.costoNeto) / p.precioNeto,
        }));

        // --- Rotación de inventario (días prom. en agotar un lote) ---
        // ventas por producto → tasa diaria (período 30 días) → días para agotar stock
        const DIAS = 30;
        const rotacion = DB.productos.map(p => {
          const vendidas = DB.ventas.filter(v => v.productoId === p.id).reduce((s, v) => s + v.cantidad, 0);
          const tasaDiaria = vendidas / DIAS;
          const diasAgota = tasaDiaria > 0 ? p.stock / tasaDiaria : Infinity;
          return { ...p, vendidas, diasAgota };
        });
        const rotacionValida = rotacion.filter(r => isFinite(r.diasAgota));
        const rotacionProm = rotacionValida.length
          ? rotacionValida.reduce((s, r) => s + r.diasAgota, 0) / rotacionValida.length
          : 0;

        return {
          ventasNeto, ivaDebito, ventasBruto, unidadesVendidas, ticketPromedio,
          gastosNeto, ivaCredito, gastosBruto, cogsNeto,
          ivaAPagar, remanenteCredito, flujoIva: ivaDebito - ivaCredito,
          utilidadNeta, margenes, rotacion, rotacionProm,
        };
      }, []);
    }

    /* ============================================================
       COMPONENTES DE UI
       ============================================================ */
    const NAV = [
      { id: "dashboard",  label: "Dashboard",           icon: "📊" },
      { id: "inventario", label: "Inventario y Precios", icon: "🧀" },
      { id: "ventas",     label: "Ventas",               icon: "📈" },
      { id: "gastos",     label: "Compras y Gastos",     icon: "📉" },
      { id: "impuestos",  label: "Impuestos (SII)",      icon: "🏛️" },
      { id: "config",     label: "Configuración",        icon: "⚙️" },
    ];

    function Sidebar({ activo, setActivo }) {
      return (
        <aside className="w-64 shrink-0 bg-white border-r border-titanio h-screen sticky top-0 flex flex-col">
          <div className="px-6 py-6 border-b border-titanio">
            <div className="flex items-center gap-3">
              <img src="./logo.jpeg" alt="Quesería La Granja"
                className="w-12 h-12 rounded-full object-cover ring-2 ring-marca/30 shadow-card shrink-0" />
              <div>
                <div className="font-extrabold text-[15px] leading-tight tracking-tight">La Granja</div>
                <div className="text-xs text-pizarra">Gestión Financiera</div>
              </div>
            </div>
          </div>
          <nav className="flex-1 px-3 py-4 space-y-1">
            {NAV.map(item => {
              const on = activo === item.id;
              return (
                <button key={item.id} onClick={() => setActivo(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                    ${on ? "bg-marca text-white shadow-card" : "text-pizarra hover:bg-humo hover:text-carbon"}`}>
                  <span className="text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
          <div className="px-6 py-4 border-t border-titanio text-xs text-pizarra">
            <div className="font-semibold text-carbon">{DB.empresa.periodo}</div>
            <div>{DB.empresa.rut}</div>
          </div>
        </aside>
      );
    }

    function Header({ titulo, subtitulo }) {
      return (
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold tracking-tight">{titulo}</h1>
          {subtitulo && <p className="text-pizarra text-sm mt-1">{subtitulo}</p>}
        </div>
      );
    }

    function Card({ children, className = "" }) {
      return (
        <div className={`bg-white rounded-2xl border border-titanio shadow-card ${className}`}>
          {children}
        </div>
      );
    }

    function KpiCard({ titulo, valor, detalle, tono = "neutro", icon }) {
      const tonos = {
        neutro:   "text-carbon",
        positivo: "text-positivo",
        negativo: "text-negativo",
        marca:    "text-marca",
      };
      return (
        <Card className="p-5">
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-pizarra">{titulo}</span>
            {icon && <span className="text-lg opacity-70">{icon}</span>}
          </div>
          <div className={`mt-3 text-[26px] font-extrabold tracking-tight ${tonos[tono]}`}>{valor}</div>
          {detalle && <div className="mt-1 text-xs text-pizarra">{detalle}</div>}
        </Card>
      );
    }

    function Badge({ children, tono = "neutro" }) {
      const map = {
        neutro:   "bg-humo text-pizarra border-titanio",
        positivo: "bg-positivo/10 text-positivo border-positivo/20",
        negativo: "bg-negativo/10 text-negativo border-negativo/20",
        marca:    "bg-marca/10 text-marca border-marca/20",
      };
      return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border ${map[tono]}`}>{children}</span>;
    }

    /* ---------------- Vistas ---------------- */

    function Dashboard({ f }) {
      const margenProm = f.margenes.reduce((s, m) => s + m.margenPct, 0) / f.margenes.length;
      const topMargen = [...f.margenes].sort((a, b) => b.margenPct - a.margenPct)[0];
      return (
        <div>
          <Header titulo="Dashboard" subtitulo={`Resumen financiero · ${DB.empresa.periodo}`} />
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-4">
            <KpiCard titulo="Utilidad Neta Mensual" icon="💰"
              tono={f.utilidadNeta >= 0 ? "positivo" : "negativo"}
              valor={CLP(f.utilidadNeta)}
              detalle="Ingresos brutos − costos − gastos − impuesto" />
            <KpiCard titulo="Flujo de IVA Mensual" icon="🏛️"
              tono={f.flujoIva >= 0 ? "negativo" : "positivo"}
              valor={CLP(f.flujoIva)}
              detalle={f.flujoIva >= 0 ? `A pagar al SII: ${CLP(f.ivaAPagar)}` : `Remanente a favor: ${CLP(f.remanenteCredito)}`} />
            <KpiCard titulo="Ticket Promedio" icon="🧾"
              tono="marca"
              valor={CLP(f.ticketPromedio)}
              detalle={`${DB.ventas.length} transacciones · bruto`} />
            <KpiCard titulo="Margen de Contribución" icon="📊"
              tono="positivo"
              valor={pct(margenProm)}
              detalle={`Mejor: ${topMargen.nombre} (${pct(topMargen.margenPct)})`} />
            <KpiCard titulo="Rotación de Inventario" icon="🔄"
              tono="neutro"
              valor={`${f.rotacionProm.toFixed(1)} días`}
              detalle="Promedio en agotar stock actual" />
            <KpiCard titulo="Ingresos Brutos" icon="📈"
              tono="marca"
              valor={CLP(f.ventasBruto)}
              detalle={`Neto ${CLP(f.ventasNeto)} + IVA ${CLP(f.ivaDebito)}`} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Margen por producto */}
            <Card className="lg:col-span-2 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg">Margen de Contribución por Producto</h2>
                <Badge tono="marca">Neto</Badge>
              </div>
              <div className="space-y-3">
                {[...f.margenes].sort((a,b)=>b.margenPct-a.margenPct).map(m => (
                  <div key={m.id}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium flex items-center gap-2"><span>{m.emoji}</span>{m.nombre}</span>
                      <span className="text-pizarra">{CLP(m.margenUnit)}/{m.formato} · <span className="font-semibold text-positivo">{pct(m.margenPct)}</span></span>
                    </div>
                    <div className="h-2 rounded-full bg-humo overflow-hidden">
                      <div className="h-full rounded-full bg-positivo" style={{ width: pct(m.margenPct) }} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Resumen tributario rápido */}
            <Card className="p-6">
              <h2 className="font-bold text-lg mb-4">Resumen Tributario</h2>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between"><span className="text-pizarra">IVA Débito (ventas)</span><span className="font-semibold text-negativo">{CLP(f.ivaDebito)}</span></div>
                <div className="flex justify-between"><span className="text-pizarra">IVA Crédito (compras)</span><span className="font-semibold text-positivo">{CLP(f.ivaCredito)}</span></div>
                <div className="border-t border-titanio pt-4 flex justify-between items-center">
                  <span className="font-semibold">A pagar al SII (día 20)</span>
                  <span className="text-xl font-extrabold text-marca">{CLP(f.ivaAPagar)}</span>
                </div>
                <div className="bg-humo rounded-xl p-3 text-xs text-pizarra">
                  Formulario 29 · Declaración mensual. Vence el <span className="font-semibold text-carbon">20 de julio 2026</span>.
                </div>
              </div>
            </Card>
          </div>
        </div>
      );
    }

    function Inventario({ f }) {
      return (
        <div>
          <Header titulo="Inventario y Precios" subtitulo="Catálogo de quesos · costo, precio neto, IVA y bruto" />
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-pizarra border-b border-titanio bg-humo/60">
                    <th className="px-6 py-3 font-semibold">Producto</th>
                    <th className="px-4 py-3 font-semibold text-right">Costo Neto</th>
                    <th className="px-4 py-3 font-semibold text-right">Precio Neto</th>
                    <th className="px-4 py-3 font-semibold text-right">IVA 19%</th>
                    <th className="px-4 py-3 font-semibold text-right">Precio Bruto</th>
                    <th className="px-4 py-3 font-semibold text-right">Margen</th>
                    <th className="px-4 py-3 font-semibold text-right">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {f.margenes.map((p, i) => (
                    <tr key={p.id} className={`border-b border-titanio/60 hover:bg-humo/50 transition ${i % 2 ? "bg-humo/20" : ""}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-humo border border-titanio flex items-center justify-center text-xl shadow-inner">{p.emoji}</div>
                          <div>
                            <div className="font-semibold">{p.nombre}</div>
                            <div className="text-xs text-pizarra">{p.id} · por {p.formato}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right text-pizarra">{CLP(p.costoNeto)}</td>
                      <td className="px-4 py-4 text-right font-medium">{CLP(p.precioNeto)}</td>
                      <td className="px-4 py-4 text-right text-pizarra">{CLP(ivaDe(p.precioNeto))}</td>
                      <td className="px-4 py-4 text-right font-bold">{CLP(bruto(p.precioNeto))}</td>
                      <td className="px-4 py-4 text-right">
                        <Badge tono="positivo">{pct(p.margenPct)}</Badge>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className={`font-semibold ${p.stock < 15 ? "text-negativo" : "text-carbon"}`}>{p.stock} {p.formato}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <p className="text-xs text-pizarra mt-3">🔴 Stock bajo (&lt; 15) destacado en rojo coral. Precio bruto = neto + IVA 19%.</p>
        </div>
      );
    }

    function Ventas({ f }) {
      return (
        <div>
          <Header titulo="Ventas (Ingresos)" subtitulo="Registro de transacciones de entrada · IVA Débito" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <KpiCard titulo="Ventas Netas" valor={CLP(f.ventasNeto)} tono="neutro" icon="📈" />
            <KpiCard titulo="IVA Débito" valor={CLP(f.ivaDebito)} tono="negativo" icon="🏛️" />
            <KpiCard titulo="Ventas Brutas" valor={CLP(f.ventasBruto)} tono="positivo" icon="💵" />
          </div>
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-pizarra border-b border-titanio bg-humo/60">
                    <th className="px-6 py-3 font-semibold">Fecha</th>
                    <th className="px-4 py-3 font-semibold">Producto</th>
                    <th className="px-4 py-3 font-semibold text-right">Cant.</th>
                    <th className="px-4 py-3 font-semibold text-right">P. Neto U.</th>
                    <th className="px-4 py-3 font-semibold text-right">Neto</th>
                    <th className="px-4 py-3 font-semibold text-right">IVA</th>
                    <th className="px-4 py-3 font-semibold text-right">Bruto</th>
                  </tr>
                </thead>
                <tbody>
                  {DB.ventas.map(v => {
                    const p = DB.productos.find(x => x.id === v.productoId);
                    const neto = v.precioNetoUnit * v.cantidad;
                    return (
                      <tr key={v.id} className="border-b border-titanio/60 hover:bg-humo/50">
                        <td className="px-6 py-3 text-pizarra">{v.fecha}</td>
                        <td className="px-4 py-3 font-medium">{p?.emoji} {p?.nombre}</td>
                        <td className="px-4 py-3 text-right">{v.cantidad}</td>
                        <td className="px-4 py-3 text-right text-pizarra">{CLP(v.precioNetoUnit)}</td>
                        <td className="px-4 py-3 text-right">{CLP(neto)}</td>
                        <td className="px-4 py-3 text-right text-pizarra">{CLP(ivaDe(neto))}</td>
                        <td className="px-4 py-3 text-right font-semibold">{CLP(bruto(neto))}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-humo font-bold">
                    <td className="px-6 py-3" colSpan="4">Totales</td>
                    <td className="px-4 py-3 text-right">{CLP(f.ventasNeto)}</td>
                    <td className="px-4 py-3 text-right text-negativo">{CLP(f.ivaDebito)}</td>
                    <td className="px-4 py-3 text-right text-positivo">{CLP(f.ventasBruto)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
        </div>
      );
    }

    function Gastos({ f }) {
      const tonoCat = { Insumo: "marca", Sueldo: "neutro", Arriendo: "neutro", Servicio: "positivo" };
      return (
        <div>
          <Header titulo="Compras y Gastos" subtitulo="Insumos, sueldos, arriendos y servicios · IVA Crédito" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <KpiCard titulo="Gastos Netos" valor={CLP(f.gastosNeto)} tono="neutro" icon="📉" />
            <KpiCard titulo="IVA Crédito" valor={CLP(f.ivaCredito)} tono="positivo" icon="🏛️" />
            <KpiCard titulo="Gastos Brutos" valor={CLP(f.gastosBruto)} tono="negativo" icon="💸" />
          </div>
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-pizarra border-b border-titanio bg-humo/60">
                    <th className="px-6 py-3 font-semibold">Fecha</th>
                    <th className="px-4 py-3 font-semibold">Categoría</th>
                    <th className="px-4 py-3 font-semibold">Descripción</th>
                    <th className="px-4 py-3 font-semibold text-right">Neto</th>
                    <th className="px-4 py-3 font-semibold text-right">IVA Créd.</th>
                    <th className="px-4 py-3 font-semibold text-right">Bruto</th>
                  </tr>
                </thead>
                <tbody>
                  {DB.gastos.map(g => (
                    <tr key={g.id} className="border-b border-titanio/60 hover:bg-humo/50">
                      <td className="px-6 py-3 text-pizarra">{g.fecha}</td>
                      <td className="px-4 py-3"><Badge tono={tonoCat[g.categoria] || "neutro"}>{g.categoria}</Badge></td>
                      <td className="px-4 py-3 font-medium">{g.descripcion}</td>
                      <td className="px-4 py-3 text-right">{CLP(g.montoNeto)}</td>
                      <td className="px-4 py-3 text-right text-positivo">{g.conIVA ? CLP(ivaDe(g.montoNeto)) : "—"}</td>
                      <td className="px-4 py-3 text-right font-semibold">{CLP(g.conIVA ? bruto(g.montoNeto) : g.montoNeto)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-humo font-bold">
                    <td className="px-6 py-3" colSpan="3">Totales</td>
                    <td className="px-4 py-3 text-right">{CLP(f.gastosNeto)}</td>
                    <td className="px-4 py-3 text-right text-positivo">{CLP(f.ivaCredito)}</td>
                    <td className="px-4 py-3 text-right text-negativo">{CLP(f.gastosBruto)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
          <p className="text-xs text-pizarra mt-3">Sueldos y arriendo no generan IVA Crédito (exentos / no afectos).</p>
        </div>
      );
    }

    function Impuestos({ f }) {
      const pagar = f.ivaAPagar > 0;
      return (
        <div>
          <Header titulo="Impuestos — Tributación Chile (SII)" subtitulo="Formulario 29 · IVA Débito vs IVA Crédito" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="p-6">
              <div className="text-xs uppercase font-semibold tracking-wide text-pizarra">IVA Débito Fiscal</div>
              <div className="text-3xl font-extrabold text-negativo mt-2">{CLP(f.ivaDebito)}</div>
              <div className="text-xs text-pizarra mt-2">19% sobre ventas netas del período</div>
              <div className="mt-4 h-1.5 rounded-full bg-negativo/20"><div className="h-full rounded-full bg-negativo w-full" /></div>
            </Card>
            <Card className="p-6">
              <div className="text-xs uppercase font-semibold tracking-wide text-pizarra">IVA Crédito Fiscal</div>
              <div className="text-3xl font-extrabold text-positivo mt-2">{CLP(f.ivaCredito)}</div>
              <div className="text-xs text-pizarra mt-2">19% sobre compras afectas</div>
              <div className="mt-4 h-1.5 rounded-full bg-positivo/20">
                <div className="h-full rounded-full bg-positivo" style={{ width: pct(Math.min(1, f.ivaCredito / f.ivaDebito)) }} />
              </div>
            </Card>
            <Card className={`p-6 ${pagar ? "ring-2 ring-marca" : "ring-2 ring-positivo"}`}>
              <div className="text-xs uppercase font-semibold tracking-wide text-pizarra">{pagar ? "IVA a Pagar" : "Remanente a Favor"}</div>
              <div className={`text-3xl font-extrabold mt-2 ${pagar ? "text-marca" : "text-positivo"}`}>
                {CLP(pagar ? f.ivaAPagar : f.remanenteCredito)}
              </div>
              <div className="text-xs text-pizarra mt-2">Débito − Crédito</div>
              <div className="mt-4 text-xs font-semibold text-carbon bg-marca/10 rounded-lg px-3 py-2 inline-block">
                📅 Vence: 20 de julio 2026
              </div>
            </Card>
          </div>

          <Card className="p-6 mt-4">
            <h2 className="font-bold text-lg mb-4">Liquidación del Período</h2>
            <div className="max-w-md space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-pizarra">(+) IVA Débito (ventas)</span><span className="font-semibold">{CLP(f.ivaDebito)}</span></div>
              <div className="flex justify-between"><span className="text-pizarra">(−) IVA Crédito (compras)</span><span className="font-semibold text-positivo">−{CLP(f.ivaCredito)}</span></div>
              <div className="border-t-2 border-carbon pt-3 flex justify-between items-center">
                <span className="font-bold">{pagar ? "Total a pagar al SII" : "Remanente mes siguiente"}</span>
                <span className={`text-2xl font-extrabold ${pagar ? "text-marca" : "text-positivo"}`}>{CLP(pagar ? f.ivaAPagar : f.remanenteCredito)}</span>
              </div>
            </div>
          </Card>
        </div>
      );
    }

    function Config({ f }) {
      const exportar = () => {
        const data = { ...DB, kpis: {
          utilidadNeta: f.utilidadNeta, ivaAPagar: f.ivaAPagar, ticketPromedio: f.ticketPromedio,
          rotacionProm: f.rotacionProm, flujoIva: f.flujoIva,
        }};
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = "queseria-la-granja-export.json"; a.click();
        URL.revokeObjectURL(url);
      };
      return (
        <div>
          <Header titulo="Configuración" subtitulo="Ajustes de la empresa y exportación de datos" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="p-6">
              <h2 className="font-bold text-lg mb-4">Datos de la Empresa</h2>
              <dl className="space-y-3 text-sm">
                {Object.entries(DB.empresa).map(([k, v]) => (
                  <div key={k} className="flex justify-between border-b border-titanio/60 pb-2">
                    <dt className="text-pizarra capitalize">{k}</dt>
                    <dd className="font-semibold text-right">{v}</dd>
                  </div>
                ))}
                <div className="flex justify-between pt-1">
                  <dt className="text-pizarra">Tasa IVA</dt>
                  <dd className="font-semibold">19%</dd>
                </div>
              </dl>
            </Card>
            <Card className="p-6">
              <h2 className="font-bold text-lg mb-4">Exportar Base de Datos</h2>
              <p className="text-sm text-pizarra mb-4">
                Descarga el JSON maestro completo (productos, ventas, gastos) con los KPI calculados,
                listo para consumir desde un backend.
              </p>
              <button onClick={exportar}
                className="w-full bg-marca hover:bg-marca/90 text-white font-semibold py-3 rounded-xl shadow-card transition">
                ⬇️ Exportar JSON
              </button>
              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                <div className="bg-humo rounded-xl py-3"><div className="text-xl font-extrabold">{DB.productos.length}</div><div className="text-xs text-pizarra">Productos</div></div>
                <div className="bg-humo rounded-xl py-3"><div className="text-xl font-extrabold">{DB.ventas.length}</div><div className="text-xs text-pizarra">Ventas</div></div>
                <div className="bg-humo rounded-xl py-3"><div className="text-xl font-extrabold">{DB.gastos.length}</div><div className="text-xs text-pizarra">Gastos</div></div>
              </div>
            </Card>
          </div>
        </div>
      );
    }

    /* ============================================================
       APP
       ============================================================ */
    function App() {
      const [activo, setActivo] = useState("dashboard");
      const f = useFinanzas();
      const vistas = {
        dashboard:  <Dashboard f={f} />,
        inventario: <Inventario f={f} />,
        ventas:     <Ventas f={f} />,
        gastos:     <Gastos f={f} />,
        impuestos:  <Impuestos f={f} />,
        config:     <Config f={f} />,
      };
      return (
        <div className="flex min-h-screen">
          <Sidebar activo={activo} setActivo={setActivo} />
          <main className="flex-1 px-8 py-8 max-w-7xl">{vistas[activo]}</main>
        </div>
      );
    }

    ReactDOM.createRoot(document.getElementById("root")).render(<App />);
  