import { useState } from "react";
import {
  AlertCircle,
  Calendar,
  Car,
  ChevronDown,
  ClipboardCheck,
  CircleHelp,
  Download,
  FileSearch,
  Hash,
  Images,
  Info,
  RefreshCw,
  ShieldAlert,
  TriangleAlert,
} from "lucide-react";
import { Etiqueta, Seccion, Tarjeta } from "./Tarjeta.jsx";
import { contarSeveridades, estiloTono, ordenarPorGravedad } from "../lib/severidad.js";
import { descargarReporte } from "../lib/reporte.js";

const estilosEstado = {
  "Sin daños visibles": "border-emerald-200 bg-emerald-50 text-emerald-700",
  "Posibles daños": "border-amber-200 bg-amber-50 text-amber-700",
  "Daños visibles": "border-rose-200 bg-rose-50 text-rose-700",
};

function formatearFecha(fecha) {
  if (!fecha) return "";
  return new Intl.DateTimeFormat("es-MX", { dateStyle: "long", timeStyle: "short" }).format(
    new Date(fecha),
  );
}

function Ficha({ valor, etiqueta, icono: Icono, tono }) {
  return (
    <div className={`rounded-xl border p-3 ${tono.ficha}`}>
      <div className="flex items-center gap-2">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white shadow-sm">
          <Icono size={15} className={tono.icono} />
        </span>
        <span className={`text-xl font-bold leading-none ${tono.cifra}`}>{valor}</span>
      </div>
      <p className="mt-1.5 text-[11px] font-medium leading-tight text-slate-600">{etiqueta}</p>
    </div>
  );
}

function Dato({ icono: Icono, etiqueta, valor }) {
  return (
    <li className="flex items-center gap-2.5 border-b border-[#eef3f9] py-2.5 last:border-0">
      <Icono size={15} className="shrink-0 text-vw-azul" />
      <span className="text-[13px] text-slate-500">{etiqueta}</span>
      <span className="ml-auto max-w-[55%] truncate text-[13px] font-semibold text-vw">
        {valor || "—"}
      </span>
    </li>
  );
}

export default function Resultados({ resultado, archivos, fecha, cita, onVolver }) {
  const [orden, setOrden] = useState("gravedad");
  const [abierto, setAbierto] = useState(null);

  const danos = resultado.danos || [];
  const conteo = contarSeveridades(danos);
  const fechaTexto = formatearFecha(fecha);
  const unidad =
    resultado.unidad || [cita?.modelo, cita?.anio].filter(Boolean).join(" ").trim();
  const vin = resultado.vin || cita?.vin || "";

  const hallazgos =
    orden === "pieza"
      ? [...danos].sort((a, b) => String(a.pieza || "").localeCompare(String(b.pieza || ""), "es"))
      : orden === "tipo"
        ? [...danos].sort((a, b) => String(a.tipo || "").localeCompare(String(b.tipo || ""), "es"))
        : ordenarPorGravedad(danos);

  const fichas = [
    { valor: conteo.grave, etiqueta: "Daños graves", icono: TriangleAlert, tono: estiloTono("Alta") },
    { valor: conteo.moderado, etiqueta: "Daño moderado", icono: AlertCircle, tono: estiloTono("Media") },
    {
      valor: conteo.leve + conteo.neutro,
      etiqueta: "Observaciones",
      icono: Info,
      tono: estiloTono("Baja"),
    },
  ];

  const meta = [
    { icono: Car, etiqueta: "Unidad", valor: unidad },
    { icono: Hash, etiqueta: "VIN", valor: vin },
    ...(cita
      ? [{ icono: ClipboardCheck, etiqueta: "Orden de ingreso", valor: cita.folio }]
      : []),
    { icono: Calendar, etiqueta: "Fecha de inspección", valor: fechaTexto },
    { icono: Images, etiqueta: "Imágenes analizadas", valor: resultado.total_imagenes },
  ];

  return (
    <Tarjeta className="mt-5 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[linear-gradient(100deg,#06183b_0%,#0a2a63_100%)] px-5 py-5 text-white sm:px-6">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10">
            <FileSearch size={19} />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold sm:text-lg">Resultados del análisis</h2>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-400/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
                Completado
              </span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-white/70">
              La IA analizó {resultado.total_imagenes ?? 0} imagen(es) y detectó {danos.length}{" "}
              hallazgo(s) en el vehículo.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-[10px] uppercase tracking-wide text-white/55">Fecha de análisis</p>
            <p className="text-[13px] font-medium">{fechaTexto}</p>
          </div>
          <button
            type="button"
            onClick={onVolver}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/25 bg-white px-4 py-2 text-xs font-semibold text-vw transition-colors hover:bg-blue-50"
          >
            <RefreshCw size={14} /> Volver a analizar
          </button>
          <button
            type="button"
            onClick={() => descargarReporte({ resultado: { ...resultado, unidad, vin }, fecha: fechaTexto })}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/25 bg-[#0b2f6b] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#12408f]"
          >
            <Download size={14} /> Generar reporte
          </button>
        </div>
      </div>

      <div className="grid gap-4 px-5 py-5 sm:px-6 sm:py-6 lg:grid-cols-2">
        <div className="relative min-w-0 overflow-hidden rounded-xl border border-vw-borde bg-white p-4">
          <img
            src="/vw.png"
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-5 right-2 w-40 opacity-[0.06]"
          />
          <div className="relative">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <h3 className="mr-auto text-sm font-semibold text-vw">Resumen general</h3>
              <Etiqueta
                color={estilosEstado[resultado.estado_general] || "border-vw-borde bg-vw-claro text-vw"}
              >
                {resultado.estado_general}
              </Etiqueta>
              {resultado.nivel_atencion && (
                <Etiqueta>Atención: {resultado.nivel_atencion}</Etiqueta>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              {fichas.map((ficha) => (
                <Ficha key={ficha.etiqueta} {...ficha} />
              ))}
            </div>

            <ul className="mt-4">
              {meta.map((dato) => (
                <Dato key={dato.etiqueta} {...dato} />
              ))}
            </ul>

            {resultado.resumen_general && (
              <p className="mt-4 rounded-lg bg-vw-claro p-3.5 text-[13px] leading-relaxed text-slate-600">
                {resultado.resumen_general}
              </p>
            )}
          </div>
        </div>

        <div className="min-w-0 rounded-xl border border-vw-borde bg-white p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-vw">Hallazgos detectados ({danos.length})</h3>
            <label className="flex items-center gap-2 text-[11px] text-slate-500">
              Ordenar por:
              <span className="relative">
                <select
                  value={orden}
                  onChange={(evento) => setOrden(evento.target.value)}
                  className="appearance-none rounded-lg border border-vw-borde bg-white py-1.5 pl-3 pr-8 text-[11px] font-semibold text-vw outline-none focus:border-vw-azul"
                >
                  <option value="gravedad">Gravedad</option>
                  <option value="pieza">Pieza</option>
                  <option value="tipo">Tipo de daño</option>
                </select>
                <ChevronDown
                  size={13}
                  className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </span>
            </label>
          </div>

          {hallazgos.length === 0 ? (
            <p className="rounded-lg bg-vw-claro p-4 text-[13px] leading-relaxed text-slate-600">
              No se identificaron daños suficientemente claros en las imágenes proporcionadas. Esto
              no descarta daños en zonas no visibles.
            </p>
          ) : (
            <ul className="space-y-3">
              {hallazgos.map((dano, indice) => {
                const tono = estiloTono(dano.severidad);
                const evidencia = dano.imagen || dano.foto || dano.evidencia_imagen;
                const miniatura =
                  evidencia || (archivos.length ? archivos[indice % archivos.length]?.vista : null);
                const expandido = abierto === indice;

                return (
                  <li
                    key={`${dano.pieza}-${indice}`}
                    className="rounded-xl border border-vw-borde bg-[#f8fafc] p-3.5"
                  >
                    <div className="flex gap-3">
                      <span
                        className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white ${tono.burbuja}`}
                      >
                        {indice + 1}
                      </span>

                      {miniatura && (
                        <img
                          src={miniatura}
                          alt=""
                          className="h-16 w-24 shrink-0 rounded-lg border border-vw-borde object-cover"
                        />
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="min-w-0 break-words text-[13px] font-semibold text-vw">
                            {dano.pieza}
                            {dano.tipo ? ` · ${dano.tipo}` : ""}
                          </h4>
                          {dano.severidad && <Etiqueta color={tono.badge}>{dano.severidad}</Etiqueta>}
                        </div>
                        <p className="mt-1 text-[12.5px] leading-relaxed text-slate-600">
                          {dano.descripcion}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setAbierto(expandido ? null : indice)}
                        aria-expanded={expandido}
                        className="hidden shrink-0 flex-col items-center justify-center gap-1 self-center text-[11px] font-semibold text-vw-azul transition-colors hover:text-vw sm:flex"
                      >
                        <span className="whitespace-nowrap">Ver evidencia</span>
                        <ChevronDown
                          size={15}
                          className={`transition-transform ${expandido ? "rotate-180" : ""}`}
                        />
                      </button>
                    </div>

                    {expandido && (
                      <p className="mt-3 break-words rounded-lg border border-vw-borde bg-white p-3 text-xs leading-relaxed text-slate-600">
                        Evidencia: {dano.evidencia || "sin detalle adicional"}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <div className="grid gap-4 px-5 pb-5 sm:px-6 sm:pb-6 md:grid-cols-3">
        <Seccion titulo="Recomendaciones" elementos={resultado.recomendaciones} icono={ClipboardCheck} />
        <Seccion titulo="Limitaciones del análisis" elementos={resultado.limitaciones} icono={CircleHelp} />
        <Seccion titulo="Zonas no evaluadas" elementos={resultado.zonas_no_evaluadas} icono={ShieldAlert} />
      </div>
    </Tarjeta>
  );
}
