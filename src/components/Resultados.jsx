//src/components/Resultados.jsx
import { useMemo, useState } from "react";
import {
  AlertCircle,
  Calendar,
  Car,
  ChevronDown,
  CircleHelp,
  Download,
  FileSearch,
  Hash,
  Images,
  Info,
  Package,
  RefreshCw,
  TriangleAlert,
} from "lucide-react";
import { Etiqueta, Seccion, Tarjeta } from "./Tarjeta.jsx";
import {
  contarSeveridades,
  estiloTono,
  ordenarPorGravedad,
} from "../lib/severidad.js";
import { descargarReporte } from "../lib/reporte.js";

function formatearFecha(fecha) {
  if (!fecha) return "";
  const fechaObj = new Date(fecha);
  if (Number.isNaN(fechaObj.getTime())) return "";
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(fechaObj);
}

function Ficha({ valor, etiqueta, icono: Icono, tono }) {
  return (
    <div className={`rounded-xl border p-3 ${tono.ficha}`}>
      <div className="flex items-center gap-2">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white shadow-sm">
          <Icono size={15} className={tono.icono} />
        </span>
        <span className={`text-xl font-bold leading-none ${tono.cifra}`}>
          {valor}
        </span>
      </div>
      <p className="mt-1.5 text-[11px] font-medium leading-tight text-slate-600">
        {etiqueta}
      </p>
    </div>
  );
}

function Dato({ icono: Icono, etiqueta, valor }) {
  return (
    <li className="flex items-center gap-2.5 border-b border-[#eef3f9] py-2.5 last:border-0">
      <Icono size={15} className="shrink-0 text-vw-azul" />
      <span className="text-[13px] text-slate-500">{etiqueta}</span>
      <span className="ml-auto max-w-[55%] truncate text-[13px] font-semibold text-vw">
        {valor ?? "—"}
      </span>
    </li>
  );
}

export default function Resultados({
  analisisGuardados = [],
  evidenciasGuardadas = [],
  cita,
  onVolver,
  onVerImagen,
}) {
  const [orden, setOrden] = useState("gravedad");
  const [abierto, setAbierto] = useState(null);

  const hallazgos = useMemo(() => {
    const lista = [];

    for (const analisis of analisisGuardados) {
      const reporte = analisis.reporte || {};
      const evidencia = evidenciasGuardadas.find(
        (item) => String(item.id) === String(analisis.evidencia_id),
      );

      for (const dano of reporte.danos || []) {
        lista.push({ categoria: "dano", ...dano, analisis, evidencia });
      }

      for (const objeto of reporte.objetos_ajenos || []) {
        lista.push({ categoria: "objeto", ...objeto, analisis, evidencia });
      }
    }

    return lista;
  }, [analisisGuardados, evidenciasGuardadas]);

  const danos = hallazgos.filter((hallazgo) => hallazgo.categoria === "dano");
  const objetos = hallazgos.filter(
    (hallazgo) => hallazgo.categoria === "objeto",
  );
  const conteo = contarSeveridades(danos);

  const totalImagenes = analisisGuardados.length;
  const fechaTexto = formatearFecha(
    analisisGuardados
      .map((analisis) => analisis.creado_en)
      .filter(Boolean)
      .sort()
      .pop(),
  );

  const unidad =
    cita?.unidad ||
    [cita?.modelo, cita?.anio].filter(Boolean).join(" ").trim();
  const vin = cita?.vin || "";

  const hallazgosOrdenados = useMemo(() => {
    if (orden === "pieza") {
      return [...hallazgos].sort((a, b) =>
        String(a.pieza || a.objeto || "").localeCompare(
          String(b.pieza || b.objeto || ""),
          "es",
        ),
      );
    }
    if (orden === "original") return hallazgos;
    return [...ordenarPorGravedad(danos), ...objetos];
  }, [orden, hallazgos, danos, objetos]);

  const fichas = [
    {
      valor: conteo.grave,
      etiqueta: "Daños graves",
      icono: TriangleAlert,
      tono: estiloTono("grave"),
    },
    {
      valor: conteo.moderado,
      etiqueta: "Daño moderado",
      icono: AlertCircle,
      tono: estiloTono("moderado"),
    },
    {
      valor: conteo.leve + conteo.neutro,
      etiqueta: "Observaciones",
      icono: Info,
      tono: estiloTono("leve"),
    },
  ];

  const meta = [
    { icono: Car, etiqueta: "Unidad", valor: unidad },
    { icono: Hash, etiqueta: "VIN", valor: vin },
    ...(cita
      ? [
          {
            icono: FileSearch,
            etiqueta: "Orden de ingreso",
            valor: cita.folio,
          },
        ]
      : []),
    {
      icono: Calendar,
      etiqueta: "Fecha de inspección",
      valor: fechaTexto,
    },
    {
      icono: Images,
      etiqueta: "Imágenes analizadas",
      valor: totalImagenes,
    },
    {
      icono: TriangleAlert,
      etiqueta: "Daños detectados",
      valor: danos.length,
    },
    {
      icono: Package,
      etiqueta: "Objetos ajenos",
      valor: objetos.length,
    },
  ];

  const resumenGeneral = analisisGuardados
    .map((analisis) => analisis.reporte?.resumen)
    .filter(Boolean)
    .filter((texto, indice, arreglo) => arreglo.indexOf(texto) === indice)
    .join(" ");

  const limitaciones = analisisGuardados
    .flatMap((analisis) =>
      Array.isArray(analisis.reporte?.limitaciones)
        ? analisis.reporte.limitaciones
        : [],
    )
    .filter((texto, indice, arreglo) => arreglo.indexOf(texto) === indice);

  function generarReporte() {
    descargarReporte({
      resultado: {
        unidad,
        vin,
        total_imagenes: totalImagenes,
        resumen_general: resumenGeneral,
        danos: danos.map((dano) => ({
          pieza: dano.pieza,
          tipo: dano.tipo,
          severidad: dano.severidad,
          descripcion: dano.descripcion,
          ubicacion: dano.ubicacion,
          evidencia: dano.evidencia?.nombre_original,
        })),
        objetos_ajenos: objetos.map((objeto) => ({
          objeto: objeto.objeto,
          descripcion: objeto.descripcion,
          ubicacion: objeto.ubicacion,
          evidencia: objeto.evidencia?.nombre_original,
        })),
        limitaciones,
      },
      fecha: fechaTexto,
    });
  }

  function verEvidencia(hallazgo) {
    const src = hallazgo.analisis?.imagen_url || hallazgo.evidencia?.url;
    if (!src || !onVerImagen) return;
    onVerImagen(
      src,
      hallazgo.evidencia?.nombre_original ||
        `Inspección anotada ${hallazgo.analisis?.id}`,
    );
  }

  return (
    <Tarjeta className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[linear-gradient(100deg,#06183b_0%,#0a2a63_100%)] px-5 py-4 text-white sm:px-6 sm:py-5">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10">
            <FileSearch size={19} />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold sm:text-lg">
                Resultados del análisis
              </h2>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-400/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
                Completado
              </span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-white/70">
              La IA analizó {totalImagenes} imagen{totalImagenes === 1 ? "" : "es"} y
              detectó {danos.length} daños detectados y {objetos.length} objetos
              ajenos.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-[10px] uppercase tracking-wide text-white/55">
              Fecha de análisis
            </p>
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
            onClick={generarReporte}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/25 bg-[#0b2f6b] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#12408f]"
          >
            <Download size={14} /> Generar reporte
          </button>
        </div>
      </div>

      <div className="grid gap-4 px-4 py-4 sm:px-5 sm:py-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className="relative min-w-0 overflow-hidden rounded-xl border border-vw-borde bg-white p-4">
          <img
            src="/vw.png"
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-5 right-2 w-40 opacity-[0.06]"
          />
          <div className="relative">
            <h3 className="mb-3 text-sm font-semibold text-vw">
              Resumen general
            </h3>

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

            {resumenGeneral && (
              <p className="mt-4 rounded-lg bg-vw-claro p-3.5 text-[13px] leading-relaxed text-slate-600">
                {resumenGeneral}
              </p>
            )}
          </div>
        </div>

        <div className="min-w-0 rounded-xl border border-vw-borde bg-white p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-vw">
              Hallazgos detectados ({hallazgos.length})
            </h3>
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
                  <option value="original">Orden original</option>
                </select>
                <ChevronDown
                  size={13}
                  className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </span>
            </label>
          </div>

          {hallazgosOrdenados.length === 0 ? (
            <p className="rounded-lg bg-vw-claro p-4 text-[13px] leading-relaxed text-slate-600">
              No se identificaron daños ni objetos ajenos suficientemente claros
              en las imágenes proporcionadas. Esto no descarta incidencias en
              zonas no visibles.
            </p>
          ) : (
            <ul className="space-y-3">
              {hallazgosOrdenados.map((hallazgo, indice) => {
                const esObjeto = hallazgo.categoria === "objeto";
                const tono = estiloTono(hallazgo.severidad);
                const miniatura =
                  hallazgo.evidencia?.url || hallazgo.analisis?.imagen_url;
                const clave = `${hallazgo.categoria}-${hallazgo.analisis?.id}-${indice}`;
                const expandido = abierto === clave;
                const titulo = esObjeto
                  ? hallazgo.objeto
                  : `${hallazgo.pieza || "Pieza no identificada"}${
                      hallazgo.tipo ? ` · ${hallazgo.tipo}` : ""
                    }`;

                return (
                  <li
                    key={clave}
                    className="rounded-xl border border-vw-borde bg-[#f8fafc] p-3.5"
                  >
                    <div className="flex gap-3">
                      <span
                        className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white ${
                          esObjeto ? "bg-orange-500" : tono.burbuja
                        }`}
                      >
                        {indice + 1}
                      </span>

                      {miniatura && (
                        <button
                          type="button"
                          onClick={() => verEvidencia(hallazgo)}
                          aria-label={`Ver evidencia de ${titulo}`}
                          className="h-16 w-24 shrink-0 overflow-hidden rounded-lg border border-vw-borde"
                        >
                          <img
                            src={miniatura}
                            alt=""
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                          />
                        </button>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="min-w-0 break-words text-[13px] font-semibold text-vw">
                            {titulo}
                          </h4>
                          {esObjeto ? (
                            <Etiqueta color="border-orange-200 bg-orange-50 text-orange-700">
                              Objeto ajeno
                            </Etiqueta>
                          ) : hallazgo.severidad ? (
                            <Etiqueta color={tono.badge}>
                              {hallazgo.severidad}
                            </Etiqueta>
                          ) : null}
                        </div>
                        <p className="mt-1 text-[12.5px] leading-relaxed text-slate-600">
                          {hallazgo.descripcion}
                        </p>
                      </div>

                      <div className="hidden shrink-0 flex-col items-center justify-center gap-1 self-center sm:flex">
                        <button
                          type="button"
                          onClick={() => verEvidencia(hallazgo)}
                          className="whitespace-nowrap rounded-lg border border-vw-borde bg-white px-3 py-1.5 text-[11px] font-semibold text-vw-azul transition-colors hover:bg-vw-claro"
                        >
                          Ver evidencia
                        </button>
                        <button
                          type="button"
                          onClick={() => setAbierto(expandido ? null : clave)}
                          aria-expanded={expandido}
                          aria-label="Ver detalle"
                          className="text-vw-azul transition-colors hover:text-vw"
                        >
                          <ChevronDown
                            size={15}
                            className={`transition-transform ${expandido ? "rotate-180" : ""}`}
                          />
                        </button>
                      </div>
                    </div>

                    {expandido && (
                      <div className="mt-3 break-words rounded-lg border border-vw-borde bg-white p-3 text-xs leading-relaxed text-slate-600">
                        {hallazgo.ubicacion && (
                          <p>
                            <span className="font-semibold text-vw">
                              Ubicación:
                            </span>{" "}
                            {hallazgo.ubicacion}
                          </p>
                        )}
                        {hallazgo.certeza && (
                          <p>
                            <span className="font-semibold text-vw">
                              Certeza:
                            </span>{" "}
                            {hallazgo.certeza}
                          </p>
                        )}
                        <p>
                          <span className="font-semibold text-vw">
                            Foto fuente:
                          </span>{" "}
                          {hallazgo.evidencia?.nombre_original ||
                            "no disponible"}
                        </p>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => verEvidencia(hallazgo)}
                      className="mt-3 w-full rounded-lg border border-vw-borde bg-white px-3 py-2 text-[12px] font-semibold text-vw-azul transition-colors hover:bg-vw-claro sm:hidden"
                    >
                      Ver evidencia
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <div className="px-4 pb-4 sm:px-5 sm:pb-5">
        <Seccion
          titulo="Limitaciones del análisis"
          elementos={limitaciones}
          icono={CircleHelp}
        />
      </div>
    </Tarjeta>
  );
}
