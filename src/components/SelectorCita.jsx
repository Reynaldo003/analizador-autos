import { useEffect, useRef, useState } from "react";
import {
  Calendar,
  CalendarCheck,
  Car,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  LoaderCircle,
  RefreshCw,
  Search,
  User,
  X,
} from "lucide-react";
import { Tarjeta } from "./Tarjeta.jsx";
import { API_BASE } from "../lib/api.js";

function formatearFechaHora(valor) {
  if (!valor) return "Sin fecha";
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(valor));
}

function formatearFechaLarga(valor) {
  if (!valor) return "Sin fecha";
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(valor));
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
      <dd className="truncate text-[12px] font-semibold text-vw">{valor || "—"}</dd>
    </div>
  );
}

function TarjetaCita({ item, seleccionada, bloqueado, onSeleccion }) {
  const marca = item.unidad || "Vehículo sin modelo registrado";
  const servicio = (item.tipo_cita || "Ingreso con cita").toUpperCase();

  return (
    <button
      type="button"
      disabled={bloqueado}
      aria-pressed={seleccionada}
      onClick={() => onSeleccion(item)}
      className={`w-[200px] shrink-0 snap-start rounded-xl border p-3 text-left transition-all disabled:opacity-60 sm:w-[230px] ${
        seleccionada
          ? "border-vw-azul bg-vw-claro/60 shadow-md ring-2 ring-vw-azul/20"
          : "border-vw-borde bg-white shadow-sm hover:-translate-y-0.5 hover:border-vw-azul/70 hover:shadow-md"
      }`}
    >
      <div className="flex items-start gap-2">
        <span
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
            seleccionada ? "bg-vw-azul text-white" : "bg-vw-claro text-vw-azul"
          }`}
        >
          <Car size={17} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-bold leading-tight text-vw">{marca}</p>
          <p className="mt-0.5 truncate text-[10px] leading-tight text-slate-400">
            {item.agencia || "Volkswagen"}
          </p>
        </div>
        <span className="shrink-0 rounded-md bg-vw-claro px-1.5 py-1 text-[10px] font-bold leading-none text-vw-azul">
          {item.folio}
        </span>
      </div>

      <p className="mt-3 line-clamp-2 min-h-[32px] text-[12px] font-bold uppercase leading-tight text-vw">
        {item.cliente || "Sin cliente"}
      </p>

      <p className="mt-1 truncate font-mono text-[11px] text-slate-500">{item.vin || "Sin VIN"}</p>

      <p className="mt-1.5 flex items-center gap-1.5 truncate text-[11px] text-slate-500">
        <Calendar size={12} className="shrink-0 text-slate-400" />
        {formatearFechaHora(item.fecha)}
      </p>

      <span
        className={`mt-3 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-white ${
          seleccionada ? "bg-vw-azul" : "bg-vw-btn"
        }`}
      >
        <CalendarCheck size={12} />
        {servicio}
      </span>

      <p className="mt-2.5 flex min-w-0 items-center gap-1.5 text-[11px] text-slate-500">
        <User size={12} className="shrink-0 text-slate-400" />
        <span className="truncate">Asesor: {item.asesor || "—"}</span>
      </p>
    </button>
  );
}

export default function SelectorCita({ cita, bloqueado, onSeleccion }) {
  const [busqueda, setBusqueda] = useState("");
  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [recarga, setRecarga] = useState(0);
  const tiraRef = useRef(null);

  useEffect(() => {
    const control = new AbortController();
    const temporizador = setTimeout(async () => {
      setCargando(true);
      setError("");

      try {
        const parametros = new URLSearchParams({ limite: "40" });
        if (busqueda.trim()) parametros.set("q", busqueda.trim());

        const respuesta = await fetch(
          `${API_BASE}/inspector-ai/api/citas/?${parametros.toString()}`,
          { signal: control.signal },
        );

        if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
        const datos = await respuesta.json();
        setCitas(Array.isArray(datos) ? datos : []);
      } catch (e) {
        if (e.name !== "AbortError") {
          setError("No se pudieron cargar las citas de la hoja de ingresos.");
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
  }, [busqueda, recarga]);

  function desplazar(paso) {
    tiraRef.current?.scrollBy({ left: paso, behavior: "smooth" });
  }

  return (
    <Tarjeta>
      <div className="flex flex-wrap items-center gap-3 px-4 pt-4 sm:px-5 sm:pt-5">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-vw-claro text-vw-azul">
          <CalendarCheck size={18} />
        </span>
        <div className="min-w-0">
          <p className="text-[13px] font-semibold leading-tight text-vw">
            Cita de la hoja de ingresos
          </p>
          <p className="mt-0.5 text-[11px] leading-tight text-slate-500">
            Las evidencias y el análisis se cargarán a la cita que selecciones
          </p>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <div className="relative">
          <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
            placeholder="Buscar por cliente, teléfono, VIN, orden o modelo…"
            className="min-h-11 w-full rounded-xl border border-[#c3d6ee] bg-white pl-10 pr-10 text-[16px] text-vw outline-none transition-colors placeholder:text-slate-400 hover:border-vw-azul/70 focus:border-vw-azul focus:shadow-[0_0_0_3px_rgba(0,114,206,0.10)] sm:text-[13px]"
          />
          {cargando && (
            <LoaderCircle
              size={15}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-vw-azul"
            />
          )}
        </div>

        {cita && (
          <div className="mt-4 overflow-hidden rounded-xl border border-emerald-200 bg-white">
            <div className="flex flex-wrap items-center gap-2 border-b border-emerald-100 bg-emerald-50 px-3.5 py-2.5">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-600 text-white">
                <Check size={14} strokeWidth={3} />
              </span>
              <p className="text-[13px] font-semibold text-emerald-900">Cita seleccionada:</p>
              <span className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 text-[11px] font-bold text-emerald-800 ring-1 ring-emerald-200">
                {cita.folio}
              </span>

              <button
                type="button"
                disabled={bloqueado}
                onClick={() => onSeleccion(null)}
                aria-label="Quitar cita seleccionada"
                className="ml-auto grid h-8 w-8 place-items-center rounded-lg border border-emerald-200 bg-white text-slate-500 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
              >
                <X size={14} />
              </button>
            </div>

            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 px-3.5 py-3 lg:grid-cols-4">
              <Dato etiqueta="Unidad" valor={cita.unidad} />
              <Dato etiqueta="Cliente" valor={cita.cliente} />
              <Dato etiqueta="VIN" valor={cita.vin} />
              <Dato etiqueta="Teléfono" valor={formatearTelefono(cita.telefono)} />
              <Dato etiqueta="Servicio" valor={cita.tipo_cita} />
              <Dato etiqueta="Ingreso" valor={formatearFechaLarga(cita.fecha)} />
              <Dato etiqueta="Asesor" valor={cita.asesor} />
              <Dato etiqueta="Agencia" valor={cita.agencia} />
            </dl>
          </div>
        )}

        <div className="relative mt-4">
          <button
            type="button"
            onClick={() => desplazar(-250)}
            aria-label="Citas anteriores"
            className="absolute -left-2 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-vw-borde bg-white text-vw shadow-md transition-colors hover:bg-vw-claro sm:grid"
          >
            <ChevronLeft size={17} />
          </button>

          <button
            type="button"
            onClick={() => desplazar(250)}
            aria-label="Citas siguientes"
            className="absolute -right-2 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-vw-borde bg-white text-vw shadow-md transition-colors hover:bg-vw-claro sm:grid"
          >
            <ChevronRight size={17} />
          </button>

          <div
            ref={tiraRef}
            className="flex snap-x gap-3 overflow-x-auto scroll-smooth px-1 pb-1 pt-0.5"
          >
            {error ? (
              <div className="flex w-full flex-col items-center gap-2 rounded-xl border border-rose-100 bg-rose-50 px-4 py-6 text-center">
                <CircleAlert size={20} className="text-rose-500" />
                <p className="text-[12px] text-slate-600">{error}</p>
                <button
                  type="button"
                  onClick={() => setRecarga((valor) => valor + 1)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-vw-borde bg-white px-3 py-1.5 text-[11px] font-semibold text-vw hover:bg-vw-claro"
                >
                  <RefreshCw size={12} /> Reintentar
                </button>
              </div>
            ) : cargando && citas.length === 0 ? (
              Array.from({ length: 5 }).map((_, indice) => (
                <div
                  key={indice}
                  className="w-[200px] shrink-0 animate-pulse rounded-xl border border-vw-borde bg-vw-claro/50 p-3 sm:w-[230px]"
                >
                  <div className="h-9 w-9 rounded-xl bg-vw-claro" />
                  <div className="mt-3 h-3 w-3/4 rounded bg-vw-claro" />
                  <div className="mt-2 h-3 w-1/2 rounded bg-vw-claro" />
                  <div className="mt-4 h-8 rounded-lg bg-vw-claro" />
                </div>
              ))
            ) : citas.length === 0 ? (
              <div className="flex w-full flex-col items-center gap-1.5 rounded-xl border border-dashed border-[#c3d6ee] px-4 py-6 text-center">
                <Car size={22} className="text-slate-400" />
                <p className="text-[12px] text-slate-500">
                  {busqueda
                    ? "Sin coincidencias para esa búsqueda."
                    : "No hay citas registradas en la hoja de ingresos."}
                </p>
              </div>
            ) : (
              citas.map((item) => (
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
        </div>

        {!error && citas.length > 0 && (
          <p className="mt-3 text-[10px] text-slate-400">
            {citas.length} cita{citas.length === 1 ? "" : "s"} de postventa · desliza para ver más
          </p>
        )}
      </div>
    </Tarjeta>
  );
}
