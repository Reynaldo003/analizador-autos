// src/components/SelectorCita.jsx
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, CalendarDays, CarFront, ChevronLeft, ChevronRight,
  Clock3, LoaderCircle, RefreshCw, Search, UserRound, X,
} from "lucide-react";
import { Tarjeta } from "./Tarjeta.jsx";
import { API_BASE } from "../lib/api.js";

const ZONA_HORARIA = "America/Mexico_City";
const INICIO_AGENDA = 8 * 60;
const FIN_AGENDA = 16 * 60;
const ANCHO_ASESOR = 190;
const ANCHO_HORA = 190;

function fechaHoy() {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: ZONA_HORARIA, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const valor = (tipo) => partes.find((parte) => parte.type === tipo)?.value || "";
  return `${valor("year")}-${valor("month")}-${valor("day")}`;
}

function moverFecha(fecha, dias) {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  const siguiente = new Date(Date.UTC(anio, mes - 1, dia + dias));
  return siguiente.toISOString().slice(0, 10);
}

function fechaLegible(fecha) {
  if (!fecha) return "";
  const [anio, mes, dia] = fecha.split("-").map(Number);
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "full", timeZone: "UTC",
  }).format(new Date(Date.UTC(anio, mes - 1, dia)));
}

function datosFecha(valor) {
  if (!valor) return null;
  const texto = String(valor);
  // Las fechas sin zona horaria ya representan la hora local capturada en el CRM.
  const local = texto.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}):(\d{2})/);
  if (local && !/(Z|[+-]\d{2}:?\d{2})$/i.test(texto)) {
    return { fecha: local[1], hora: `${local[2]}:${local[3]}` };
  }
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return null;
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: ZONA_HORARIA, hourCycle: "h23", year: "numeric", month: "2-digit",
    day: "2-digit", hour: "2-digit", minute: "2-digit",
  }).formatToParts(fecha);
  const dato = (tipo) => partes.find((parte) => parte.type === tipo)?.value || "";
  return {
    fecha: `${dato("year")}-${dato("month")}-${dato("day")}`,
    hora: `${dato("hour")}:${dato("minute")}`,
  };
}

function minutoCita(cita) {
  const hora = datosFecha(cita.fecha)?.hora;
  if (!hora) return null;
  const [horas, minutos] = hora.split(":").map(Number);
  return horas * 60 + minutos;
}

function horaCelda(cita) {
  const minuto = minutoCita(cita);
  if (minuto === null) return "";
  const inicio = Math.floor(minuto / 30) * 30;
  return `${String(Math.floor(inicio / 60)).padStart(2, "0")}:${String(inicio % 60).padStart(2, "0")}`;
}

function normalizar(valor) {
  return String(valor ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function grupoCita(cita) {
  return `${cita.agencia || "Sin agencia"}::${cita.asesor || "Sin asesor"}`;
}

function estiloServicio(tipo) {
  const texto = normalizar(tipo);
  if (texto.includes("diagn")) return "border-violet-200 bg-violet-50 text-violet-700";
  if (texto.includes("repar")) return "border-amber-200 bg-amber-50 text-amber-800";
  if (texto.includes("campa")) return "border-teal-200 bg-teal-50 text-teal-800";
  return "border-blue-200 bg-blue-50 text-blue-800";
}

function Dato({ titulo, valor }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{titulo}</dt>
      <dd className="mt-1 break-words text-[12px] font-semibold text-vw">{valor || "—"}</dd>
    </div>
  );
}

function CitaAgenda({ cita, bloqueado, onSeleccion, mostrarAsesor = false }) {
  const servicio = cita.tipo_cita || "Servicio sin especificar";
  return (
    <button
      type="button"
      disabled={bloqueado}
      onClick={() => onSeleccion(cita)}
      className="group w-full min-w-0 rounded-xl border border-[#D6E0ED] bg-white p-3 text-left shadow-sm transition hover:border-vw-azul hover:bg-[#F7FAFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vw-azul disabled:cursor-not-allowed disabled:opacity-60"
      aria-label={`Abrir cita de ${cita.cliente || "cliente sin nombre"} a las ${datosFecha(cita.fecha)?.hora || "hora desconocida"}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1 text-[11px] font-bold text-vw-azul">
          <Clock3 size={13} /> {datosFecha(cita.fecha)?.hora || "--:--"}
        </span>
        {cita.folio && <span className="max-w-[75px] truncate rounded bg-vw-claro px-1.5 py-0.5 text-[10px] font-semibold text-vw">#{cita.folio}</span>}
      </div>
      <p className="mt-2 line-clamp-2 text-[12px] font-bold uppercase leading-snug text-vw">{cita.cliente || "Cliente sin nombre"}</p>
      <p className="mt-1 flex items-center gap-1.5 truncate text-[11px] text-slate-600">
        <CarFront size={13} className="shrink-0" /> {cita.unidad || "Modelo no registrado"}
      </p>
      {mostrarAsesor && (
        <p className="mt-1 flex items-center gap-1.5 truncate text-[11px] text-slate-500">
          <UserRound size={13} className="shrink-0" /> {cita.asesor || "Sin asesor"}
        </p>
      )}
      <span className={`mt-2 inline-block max-w-full truncate rounded-md border px-2 py-1 text-[10px] font-semibold ${estiloServicio(servicio)}`} title={servicio}>
        {servicio}
      </span>
    </button>
  );
}

export default function SelectorCita({ cita, bloqueado, onSeleccion }) {
  const [fecha, setFecha] = useState(fechaHoy);
  const [busqueda, setBusqueda] = useState("");
  const [agencia, setAgencia] = useState("Todas");
  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [recarga, setRecarga] = useState(0);

  useEffect(() => {
    if (cita) return;
    const control = new AbortController();
    const temporizador = setTimeout(async () => {
      setCargando(true);
      setError("");
      try {
        const parametros = new URLSearchParams({ limite: "100", desde: fecha, hasta: fecha });
        if (busqueda.trim()) parametros.set("q", busqueda.trim());
        const respuesta = await fetch(`${API_BASE}/inspector-ai/api/citas/?${parametros}`, { signal: control.signal });
        if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
        const datos = await respuesta.json();
        if (!control.signal.aborted) setCitas(Array.isArray(datos) ? datos : []);
      } catch (errorConsulta) {
        if (!control.signal.aborted) {
          console.error("Error consultando agenda:", errorConsulta);
          setCitas([]);
          setError("No se pudieron consultar las citas del día.");
        }
      } finally {
        if (!control.signal.aborted) setCargando(false);
      }
    }, busqueda.trim() ? 300 : 0);
    return () => { control.abort(); clearTimeout(temporizador); };
  }, [fecha, busqueda, recarga, cita?.id]);

  const agencias = useMemo(() => ["Todas", ...new Set(citas.map((item) => item.agencia).filter(Boolean))], [citas]);
  useEffect(() => {
    if (agencia !== "Todas" && !agencias.includes(agencia)) setAgencia("Todas");
  }, [agencia, agencias]);

  const citasVisibles = useMemo(() => citas.filter((item) => {
    if (datosFecha(item.fecha)?.fecha !== fecha) return false;
    if (agencia !== "Todas" && item.agencia !== agencia) return false;
    const texto = [item.cliente, item.unidad, item.vin, item.folio, item.asesor, item.telefono, item.tipo_cita]
      .map(normalizar).join(" ");
    return !busqueda.trim() || texto.includes(normalizar(busqueda.trim()));
  }).sort((a, b) => (minutoCita(a) ?? 0) - (minutoCita(b) ?? 0)), [citas, fecha, agencia, busqueda]);

  const asesores = useMemo(() => {
    const grupos = new Map();
    citasVisibles.forEach((item) => {
      const id = grupoCita(item);
      if (!grupos.has(id)) grupos.set(id, { id, nombre: item.asesor || "Sin asesor", agencia: item.agencia || "Sin agencia" });
    });
    return Array.from(grupos.values()).sort((a, b) => a.agencia.localeCompare(b.agencia, "es") || a.nombre.localeCompare(b.nombre, "es"));
  }, [citasVisibles]);

  const horarios = useMemo(() => {
    const minutos = citasVisibles.map(minutoCita).filter((valor) => valor !== null);
    const inicio = Math.min(INICIO_AGENDA, ...minutos.map((valor) => Math.floor(valor / 30) * 30));
    const fin = Math.max(FIN_AGENDA, ...minutos.map((valor) => Math.floor(valor / 30) * 30));
    const resultado = [];
    for (let minuto = inicio; minuto <= fin; minuto += 30) {
      resultado.push(`${String(Math.floor(minuto / 60)).padStart(2, "0")}:${String(minuto % 60).padStart(2, "0")}`);
    }
    return resultado;
  }, [citasVisibles]);

  const citasPorCelda = useMemo(() => {
    const mapa = new Map();
    citasVisibles.forEach((item) => {
      const clave = `${grupoCita(item)}|${horaCelda(item)}`;
      mapa.set(clave, [...(mapa.get(clave) || []), item]);
    });
    return mapa;
  }, [citasVisibles]);

  if (cita) {
    return (
      <Tarjeta className="min-w-0 overflow-hidden">
        <div className="p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-vw-azul">Cita seleccionada</p>
              <h2 className="mt-1 text-[17px] font-bold uppercase text-vw">{cita.cliente || "Cliente sin nombre"}</h2>
            </div>
            <button type="button" onClick={() => onSeleccion(null)} disabled={bloqueado}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-vw-borde bg-white px-4 text-[12px] font-semibold text-vw transition hover:bg-vw-claro disabled:opacity-50">
              <ArrowLeft size={16} /> Volver a la agenda
            </button>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-vw-borde pt-4 sm:grid-cols-3 lg:grid-cols-6">
            <Dato titulo="Folio" valor={cita.folio} />
            <Dato titulo="Fecha y hora" valor={`${fechaLegible(datosFecha(cita.fecha)?.fecha)} · ${datosFecha(cita.fecha)?.hora || "--:--"}`} />
            <Dato titulo="Agencia" valor={cita.agencia} />
            <Dato titulo="Asesor" valor={cita.asesor} />
            <Dato titulo="Vehículo" valor={cita.unidad} />
            <Dato titulo="VIN" valor={cita.vin} />
          </dl>
        </div>
      </Tarjeta>
    );
  }

  return (
    <Tarjeta className="min-w-0 overflow-hidden">
      <div className="p-4 sm:p-5 lg:p-6">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-vw-claro text-vw-azul"><CalendarDays size={21} /></span>
          <div>
            <h2 className="text-[17px] font-bold text-vw">Agenda de citas</h2>
            <p className="text-[12px] text-slate-500">Selecciona una cita para abrir su expediente de evidencias y el analizador IA.</p>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" aria-label="Día anterior" onClick={() => setFecha(moverFecha(fecha, -1))}
              className="grid h-11 w-11 place-items-center rounded-xl border border-vw-borde text-vw hover:bg-vw-claro"><ChevronLeft size={18} /></button>
            <button type="button" onClick={() => setFecha(fechaHoy())}
              className="h-11 rounded-xl border border-vw-borde px-4 text-[12px] font-semibold text-vw hover:bg-vw-claro">Hoy</button>
            <button type="button" aria-label="Día siguiente" onClick={() => setFecha(moverFecha(fecha, 1))}
              className="grid h-11 w-11 place-items-center rounded-xl border border-vw-borde text-vw hover:bg-vw-claro"><ChevronRight size={18} /></button>
            <input aria-label="Fecha de la agenda" type="date" value={fecha} onChange={(evento) => evento.target.value && setFecha(evento.target.value)}
              className="h-11 min-w-0 rounded-xl border border-vw-borde bg-white px-3 text-[13px] font-semibold text-vw outline-none focus:border-vw-azul" />
          </div>
          <div className="relative w-full xl:max-w-sm">
            <Search size={17} className="pointer-events-none absolute left-3 top-3.5 text-slate-400" />
            <input value={busqueda} onChange={(evento) => setBusqueda(evento.target.value)}
              placeholder="Cliente, teléfono, VIN, folio o modelo" aria-label="Buscar citas"
              className="min-h-11 w-full rounded-xl border border-vw-borde bg-white pl-10 pr-10 text-[16px] text-vw outline-none focus:border-vw-azul sm:text-[13px]" />
            {busqueda && <button type="button" onClick={() => setBusqueda("")} aria-label="Limpiar búsqueda"
              className="absolute right-3 top-3 grid h-5 w-5 place-items-center text-slate-400"><X size={16} /></button>}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[13px] font-bold capitalize text-vw">{fechaLegible(fecha)}</p>
          <p className="text-[12px] font-semibold text-slate-500">
            {cargando ? <span className="inline-flex items-center gap-2"><LoaderCircle size={14} className="animate-spin" /> Cargando...</span>
              : `${citasVisibles.length} cita${citasVisibles.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
          {agencias.map((item) => (
            <button key={item} type="button" onClick={() => setAgencia(item)}
              className={`shrink-0 rounded-lg border px-3 py-2 text-[12px] font-semibold transition ${agencia === item
                ? "border-vw-azul bg-vw-azul text-white" : "border-vw-borde bg-white text-vw hover:bg-vw-claro"}`}>{item}</button>
          ))}
        </div>

        {error ? (
          <div role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-5 text-center text-[12px] text-rose-800">
            {error}
            <button type="button" onClick={() => setRecarga((valor) => valor + 1)}
              className="mx-auto mt-3 flex items-center gap-2 rounded-lg bg-white px-3 py-2 font-semibold text-vw"><RefreshCw size={15} /> Reintentar</button>
          </div>
        ) : cargando ? (
          <div className="mt-4 grid gap-3 md:grid-cols-3">{[1, 2, 3].map((numero) => <div key={numero} className="h-36 animate-pulse rounded-xl bg-vw-claro" />)}</div>
        ) : citasVisibles.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-vw-borde p-8 text-center text-[13px] text-slate-500">
            No hay citas para esta fecha y los filtros seleccionados.
          </div>
        ) : (
          <>
            {/* En móvil resulta más cómodo recorrer las citas cronológicamente. */}
            <div className="mt-4 space-y-3 lg:hidden">
              {citasVisibles.map((item) => (
                <div key={item.id} className="flex items-start gap-3">
                  <span className="w-[52px] shrink-0 pt-3 text-[11px] font-bold tabular-nums text-vw">{datosFecha(item.fecha)?.hora || "--:--"}</span>
                  <div className="min-w-0 flex-1"><CitaAgenda cita={item} bloqueado={bloqueado} onSeleccion={onSeleccion} mostrarAsesor /></div>
                </div>
              ))}
            </div>

            {/* En escritorio se conserva la matriz asesor / horario del CRM. */}
            <div className="mt-4 hidden max-h-[690px] overflow-auto rounded-xl border border-vw-borde lg:block">
              <div className="grid w-max min-w-full" style={{
                gridTemplateColumns: `${ANCHO_ASESOR}px repeat(${horarios.length}, ${ANCHO_HORA}px)`,
                gridTemplateRows: `44px repeat(${asesores.length}, minmax(155px, auto))`,
              }}>
                <div className="sticky left-0 top-0 z-30 flex items-center border-b border-r border-vw-borde bg-white px-4 text-[11px] font-bold uppercase text-vw">Asesor</div>
                {horarios.map((hora) => (
                  <div key={hora} className="sticky top-0 z-20 flex items-center justify-center border-b border-r border-vw-borde bg-white text-[11px] font-bold text-vw">{hora}</div>
                ))}
                {asesores.map((asesor) => (
                  <div key={asesor.id} className="contents">
                    <div className="sticky left-0 z-10 flex min-h-[155px] flex-col justify-center border-b border-r border-vw-borde bg-white px-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-vw-claro text-vw-azul"><UserRound size={17} /></div>
                      <p className="mt-2 line-clamp-2 text-[12px] font-bold text-vw">{asesor.nombre}</p>
                      <p className="mt-1 text-[10px] text-slate-500">{asesor.agencia}</p>
                      <p className="mt-2 text-[10px] font-semibold text-vw-azul">{citasVisibles.filter((item) => grupoCita(item) === asesor.id).length} citas</p>
                    </div>
                    {horarios.map((hora) => (
                      <div key={`${asesor.id}-${hora}`} className="min-h-[155px] border-b border-r border-vw-borde bg-slate-50/60 p-2">
                        <div className="flex max-h-[190px] flex-col gap-2 overflow-y-auto">
                          {(citasPorCelda.get(`${asesor.id}|${hora}`) || []).map((item) => (
                            <CitaAgenda key={item.id} cita={item} bloqueado={bloqueado} onSeleccion={onSeleccion} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </Tarjeta>
  );
}
