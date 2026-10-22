
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Calendar, CalendarCheck, Car, Check, ChevronLeft, ChevronRight,
  CircleAlert, LoaderCircle, RefreshCw, Search, User, X,
} from "lucide-react";
import { Tarjeta } from "./Tarjeta.jsx";
import { API_BASE } from "../lib/api.js";

function fechaLocal(fecha) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

function formatearFechaHora(valor) {
  if (!valor) return "Sin fecha";
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return "Sin fecha";
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(fecha);
}

function formatearTelefono(valor) {
  const digitos = String(valor || "").replace(/\D/g, "");
  if (digitos.length === 12 && digitos.startsWith("52")) {
    return `+52 ${digitos.slice(2, 5)} ${digitos.slice(5, 8)} ${digitos.slice(8)}`;
  }
  if (digitos.length === 10) {
    return `${digitos.slice(0, 3)} ${digitos.slice(3, 6)} ${digitos.slice(6)}`;
  }
  return valor || "";
}

function Dato({ etiqueta, valor }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] uppercase tracking-wide text-slate-400">{etiqueta}</dt>
      <dd className="break-words text-[12px] font-semibold text-vw">{valor || "—"}</dd>
    </div>
  );
}

function TarjetaCita({ item, seleccionada, bloqueado, onSeleccion }) {
  const servicio = (item.tipo_cita || "Ingreso con cita").toUpperCase();

  return (
    <button
      type="button"
      disabled={bloqueado}
      aria-pressed={seleccionada}
      onClick={() => onSeleccion(item)}
      className={`w-[min(82vw,290px)] shrink-0 snap-start rounded-xl border p-3 text-left transition-colors disabled:opacity-60 sm:w-[235px] ${seleccionada
          ? "border-vw-azul bg-vw-claro/70 ring-2 ring-vw-azul/20"
          : "border-vw-borde bg-white hover:border-vw-azul/70"
        }`}
    >
      <div className="flex items-start gap-2">
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${seleccionada ? "bg-vw-azul text-white" : "bg-vw-claro text-vw-azul"
          }`}>
          <Car size={17} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-bold text-vw">
            {item.unidad || "Vehículo sin modelo"}
          </p>
          <p className="truncate text-[10px] text-slate-500">
            {item.agencia || "Sin agencia"}
          </p>
        </div>
        <span className="shrink-0 rounded-md bg-vw-claro px-1.5 py-1 text-[10px] font-semibold text-vw-azul">
          {item.folio}
        </span>
      </div>

      <p className="mt-3 line-clamp-2 min-h-8 text-[12px] font-bold uppercase leading-tight text-vw">
        {item.cliente || "Sin cliente"}
      </p>
      <p className="mt-1 truncate font-mono text-[11px] text-slate-500">
        {item.vin || "Sin VIN"}
      </p>
      <p className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
        <Calendar size={12} className="shrink-0" />
        {formatearFechaHora(item.fecha)}
      </p>
      <span className={`mt-3 flex min-h-8 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-center text-[10px] font-semibold text-white ${seleccionada ? "bg-vw-azul" : "bg-vw-btn"
        }`}>
        <CalendarCheck size={12} className="shrink-0" />
        <span className="line-clamp-2">{servicio}</span>
      </span>
      <p className="mt-2.5 flex items-center gap-1.5 text-[11px] text-slate-500">
        <User size={12} className="shrink-0" />
        <span className="truncate">Asesor: {item.asesor || "—"}</span>
      </p>
    </button>
  );
}

export default function SelectorCita({ cita, bloqueado, onSeleccion }) {
  const [busqueda, setBusqueda] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [recarga, setRecarga] = useState(0);
  const tiraRef = useRef(null);
  const rangoInvalido = Boolean(desde && hasta && desde > hasta);

  function periodo(tipo) {
    const ahora = new Date();
    const fin = fechaLocal(ahora);

    if (tipo === "todas") {
      setDesde("");
      setHasta("");
    } else if (tipo === "hoy") {
      setDesde(fin);
      setHasta(fin);
    } else if (tipo === "semana") {
      const inicio = new Date(ahora);
      inicio.setDate(inicio.getDate() - 6);
      setDesde(fechaLocal(inicio));
      setHasta(fin);
    } else if (tipo === "mes") {
      setDesde(fechaLocal(new Date(ahora.getFullYear(), ahora.getMonth(), 1)));
      setHasta(fin);
    }
  }

  useEffect(() => {
    if (rangoInvalido) {
      setCargando(false);
      return;
    }

    const control = new AbortController();

    const temporizador = setTimeout(async () => {
      setCargando(true);
      setError("");

      try {
        const parametros = new URLSearchParams({ limite: "100" });
        if (busqueda.trim()) parametros.set("q", busqueda.trim());
        if (desde) parametros.set("desde", desde);
        if (hasta) parametros.set("hasta", hasta);

        const respuesta = await fetch(
          `${API_BASE}/inspector-ai/api/citas/?${parametros}`,
          { signal: control.signal }
        );

        if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);

        const datos = await respuesta.json();

        if (!control.signal.aborted) {
          setCitas(Array.isArray(datos) ? datos : []);
        }
      } catch (e) {
        if (e.name !== "AbortError") {
          setError("No se pudieron cargar las citas. Intenta nuevamente.");
          setCitas([]);
        }
      } finally {
        if (!control.signal.aborted) setCargando(false);
      }
    }, busqueda ? 300 : 0);

    return () => {
      control.abort();
      clearTimeout(temporizador);
    };
  }, [busqueda, desde, hasta, recarga, rangoInvalido]);

  // Filtra también en React si el backend todavía no procesa las fechas.
  const citasVisibles = useMemo(() => citas.filter((item) => {
    const fecha = String(item.fecha || "").slice(0, 10);
    if (desde && (!fecha || fecha < desde)) return false;
    if (hasta && (!fecha || fecha > hasta)) return false;
    return true;
  }), [citas, desde, hasta]);

  return (
    <Tarjeta className="min-w-0 overflow-hidden">
      <div className="p-4 sm:p-5 lg:p-6">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-vw-claro text-vw-azul">
            <CalendarCheck size={19} />
          </span>
          <div className="min-w-0">
            <h2 className="text-[14px] font-bold text-vw">Seleccionar cita</h2>
            <p className="text-[12px] text-slate-500">
              Busca la cita a la que se anexarán las evidencias y los resultados de IA.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="relative min-w-0">
            <label htmlFor="buscar-cita" className="mb-1 block text-[11px] font-semibold text-slate-600">
              Buscar cita
            </label>
            <Search size={16} className="pointer-events-none absolute bottom-3.5 left-3.5 text-slate-400" />
            <input
              id="buscar-cita"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Cliente, teléfono, VIN, folio o modelo"
              className="min-h-11 w-full rounded-xl border border-[#c3d6ee] bg-white pl-10 pr-10 text-[16px] text-vw outline-none focus:border-vw-azul sm:text-[13px]"
            />
            {cargando && (
              <LoaderCircle size={16} className="absolute bottom-3.5 right-3.5 animate-spin text-vw-azul" />
            )}
          </div>

          <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
            <div className="min-w-0">
              <label htmlFor="fecha-desde" className="mb-1 block text-[11px] font-semibold text-slate-600">
                Desde
              </label>
              <input
                id="fecha-desde"
                type="date"
                value={desde}
                onChange={(e) => setDesde(e.target.value)}
                className="min-h-11 w-full min-w-0 rounded-xl border border-[#c3d6ee] bg-white px-2 text-[13px] text-vw outline-none focus:border-vw-azul"
              />
            </div>
            <div className="min-w-0">
              <label htmlFor="fecha-hasta" className="mb-1 block text-[11px] font-semibold text-slate-600">
                Hasta
              </label>
              <input
                id="fecha-hasta"
                type="date"
                value={hasta}
                onChange={(e) => setHasta(e.target.value)}
                className="min-h-11 w-full min-w-0 rounded-xl border border-[#c3d6ee] bg-white px-2 text-[13px] text-vw outline-none focus:border-vw-azul"
              />
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {[
            ["hoy", "Hoy"],
            ["semana", "Últimos 7 días"],
            ["mes", "Este mes"],
            ["todas", "Todas las fechas"],
          ].map(([tipo, etiqueta]) => (
            <button
              key={tipo}
              type="button"
              onClick={() => periodo(tipo)}
              className="min-h-9 rounded-lg border border-vw-borde bg-white px-3 py-1.5 text-[11px] font-semibold text-vw hover:border-vw-azul hover:bg-vw-claro"
            >
              {etiqueta}
            </button>
          ))}
        </div>

        {rangoInvalido && (
          <p role="alert" className="mt-2 text-[12px] text-rose-600">
            La fecha inicial no puede ser posterior a la final.
          </p>
        )}

        {cita && (
          <div className="mt-4 overflow-hidden rounded-xl border border-emerald-200">
            <div className="flex flex-wrap items-center gap-2 bg-emerald-50 px-3 py-2.5">
              <Check size={18} className="text-emerald-600" />
              <p className="text-[12px] font-bold text-emerald-900">Cita seleccionada</p>
              <span className="rounded-md bg-white px-2 py-1 text-[11px] font-semibold text-emerald-800">
                {cita.folio}
              </span>
              <button
                type="button"
                onClick={() => onSeleccion(null)}
                disabled={bloqueado}
                aria-label="Quitar cita"
                className="ml-auto grid h-10 w-10 place-items-center rounded-lg border border-emerald-200 bg-white text-slate-500 disabled:opacity-50"
              >
                <X size={17} />
              </button>
            </div>
            <dl className="grid grid-cols-2 gap-3 p-3 sm:grid-cols-4 sm:p-4">
              <Dato etiqueta="Unidad" valor={cita.unidad} />
              <Dato etiqueta="Cliente" valor={cita.cliente} />
              <Dato etiqueta="VIN" valor={cita.vin} />
              <Dato etiqueta="Teléfono" valor={formatearTelefono(cita.telefono)} />
              <Dato etiqueta="Servicio" valor={cita.tipo_cita} />
              <Dato etiqueta="Ingreso" valor={formatearFechaHora(cita.fecha)} />
              <Dato etiqueta="Asesor" valor={cita.asesor} />
              <Dato etiqueta="Agencia" valor={cita.agencia} />
            </dl>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between gap-2">
          <p className="text-[12px] font-semibold text-vw">
            {cargando
              ? "Buscando citas..."
              : `${rangoInvalido ? 0 : citasVisibles.length} citas encontradas`}
          </p>
          <div className="hidden gap-2 sm:flex">
            <button
              type="button"
              aria-label="Citas anteriores"
              onClick={() => tiraRef.current?.scrollBy({ left: -260, behavior: "smooth" })}
              className="grid h-10 w-10 place-items-center rounded-lg border border-vw-borde text-vw"
            >
              <ChevronLeft size={17} />
            </button>
            <button
              type="button"
              aria-label="Citas siguientes"
              onClick={() => tiraRef.current?.scrollBy({ left: 260, behavior: "smooth" })}
              className="grid h-10 w-10 place-items-center rounded-lg border border-vw-borde text-vw"
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>

        <div
          ref={tiraRef}
          className="mt-2 flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-3"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {error ? (
            <div role="alert" className="w-full rounded-xl border border-rose-200 bg-rose-50 p-5 text-center text-[12px] text-rose-800">
              <CircleAlert size={20} className="mx-auto mb-2" />
              {error}
              <button
                type="button"
                onClick={() => setRecarga((valor) => valor + 1)}
                className="mx-auto mt-3 flex items-center gap-1 rounded-lg bg-white px-3 py-2 font-semibold text-vw"
              >
                <RefreshCw size={14} /> Reintentar
              </button>
            </div>
          ) : cargando && citasVisibles.length === 0 ? (
            [1, 2, 3].map((n) => (
              <div key={n} className="h-48 w-[235px] shrink-0 animate-pulse rounded-xl bg-vw-claro" />
            ))
          ) : rangoInvalido || citasVisibles.length === 0 ? (
            <div className="w-full rounded-xl border border-dashed border-vw-borde p-6 text-center text-[12px] text-slate-500">
              No hay citas para la búsqueda o el período seleccionado.
            </div>
          ) : (
            citasVisibles.map((item) => (
              <TarjetaCita
                key={item.id}
                item={item}
                seleccionada={cita?.id === item.id}
                bloqueado={bloqueado}
                onSeleccion={onSeleccion}
              />
            ))
          )}
        </div>

        <p className="mt-1 text-[11px] text-slate-400">
          Desliza horizontalmente para explorar las citas.
          {citas.length >= 100
            ? " La consulta está limitada a 100 resultados; afina la búsqueda o usa filtros de fechas del servidor para ver citas más antiguas."
            : ""}
        </p>
      </div>
    </Tarjeta>
  );
}
