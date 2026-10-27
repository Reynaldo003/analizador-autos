
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

      <span className="text-[13px] text-slate-500">
        {etiqueta}
      </span>

      <span className="ml-auto max-w-[55%] truncate text-[13px] font-semibold text-vw">
        {valor ?? "—"}
      </span>
    </li>
  );
}

function normalizarTexto(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function nivelSeveridad(valor) {
  const texto = normalizarTexto(valor);

  if (/grave|alto|severo/.test(texto)) return 3;
  if (/moderad|medio/.test(texto)) return 2;
  if (/leve|bajo/.test(texto)) return 1;

  return 0;
}

function quitarRepeticiones(lista) {
  const vistos = new Set();

  return lista.filter((texto) => {
    const clave = normalizarTexto(texto);

    if (!clave || vistos.has(clave)) return false;

    vistos.add(clave);
    return true;
  });
}

export default function Resultados({
  analisisGuardados = [],
  evidenciasGuardadas = [],
  cita,
  onVolver,
  onVerImagen,
  analizando = false,
}) {
  const [orden, setOrden] = useState("gravedad");

  // Una sección por fotografía analizada.
  // No se elimina ni fusiona ningún daño original.

  const fotosAnalizadas = useMemo(() => {
    return analisisGuardados.map((analisis, indice) => {
      const reporte = analisis.reporte || {};

      const evidencia = evidenciasGuardadas.find(
        (item) =>
          String(item.id) === String(analisis.evidencia_id)
      );

      return {
        clave: String(
          analisis.id ?? analisis.evidencia_id ?? indice
        ),
        numero: indice + 1,
        analisis,
        evidencia,
        danos: Array.isArray(reporte.danos)
          ? reporte.danos
          : [],
        objetos: Array.isArray(reporte.objetos_ajenos)
          ? reporte.objetos_ajenos
          : [],
      };
    });
  }, [analisisGuardados, evidenciasGuardadas]);

  // Conservamos todos los registros originales para
  // las estadísticas y el reporte descargable.

  const danos = fotosAnalizadas.flatMap((foto) =>
    foto.danos.map((dano) => ({
      ...dano,
      evidencia: foto.evidencia,
      analisis: foto.analisis,
    }))
  );

  const objetos = fotosAnalizadas.flatMap((foto) =>
    foto.objetos.map((objeto) => ({
      ...objeto,
      evidencia: foto.evidencia,
      analisis: foto.analisis,
    }))
  );

  const conteo = contarSeveridades(danos);

  const totalImagenes = analisisGuardados.length;
  const imagenesPendientes = analisisGuardados.filter(
    (analisis) => !analisis.imagen_url && !analisis.imagen_resultado
  ).length;

  const fechaTexto = formatearFecha(
    analisisGuardados
      .map((analisis) => analisis.creado_en)
      .filter(Boolean)
      .sort()
      .pop()
  );

  const unidad =
    cita?.unidad ||
    [cita?.modelo, cita?.anio]
      .filter(Boolean)
      .join(" ")
      .trim();

  const vin = cita?.vin || "";

  // Ordenamos los daños dentro de cada foto.
  // Nunca mezclamos resultados entre fotografías.

  const fotosOrdenadas = useMemo(() => {
    return fotosAnalizadas.map((foto) => {
      const danosFoto = [...foto.danos];

      if (orden === "pieza") {
        danosFoto.sort((a, b) =>
          String(a.pieza || "").localeCompare(
            String(b.pieza || ""),
            "es"
          )
        );
      } else if (orden === "gravedad") {
        danosFoto.sort(
          (a, b) =>
            nivelSeveridad(b.severidad) -
            nivelSeveridad(a.severidad)
        );
      }

      return {
        ...foto,
        danos: danosFoto,
      };
    });
  }, [fotosAnalizadas, orden]);

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
    {
      icono: Car,
      etiqueta: "Unidad",
      valor: unidad,
    },
    {
      icono: Hash,
      etiqueta: "VIN",
      valor: vin,
    },
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
    .filter(
      (texto, indice, arreglo) =>
        arreglo.indexOf(texto) === indice
    )
    .join(" ");

  const limitaciones = analisisGuardados.flatMap(
    (analisis) =>
      Array.isArray(analisis.reporte?.limitaciones)
        ? analisis.reporte.limitaciones
        : []
  );

  const limitacionesUnicas =
    quitarRepeticiones(limitaciones);

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

        limitaciones: limitacionesUnicas,
      },
      fecha: fechaTexto,
    });
  }

  function verFoto(foto) {
    const src =
      foto.analisis?.imagen_url ||
      foto.evidencia?.url;

    if (!src || !onVerImagen) return;

    onVerImagen(
      src,
      foto.evidencia?.nombre_original ||
        `Inspección anotada ${foto.analisis?.id}`
    );
  }

  return (
    <Tarjeta className="overflow-hidden">

      {/* ENCABEZADO ORIGINAL */}

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

              <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                imagenesPendientes > 0
                  ? "border-amber-300/40 bg-amber-300/15 text-amber-200"
                  : "border-emerald-400/40 bg-emerald-400/15 text-emerald-300"
              }`}>
                {imagenesPendientes > 0
                  ? `Texto listo · ${imagenesPendientes} ${imagenesPendientes === 1 ? "imagen pendiente" : "imágenes pendientes"}`
                  : "Completado"}
              </span>
            </div>

            <p className="mt-1 text-xs leading-relaxed text-white/70">
              La IA analizó {totalImagenes}{" "}
              {totalImagenes === 1 ? "imagen" : "imágenes"} y
              registró {danos.length} daños y{" "}
              {objetos.length} objetos ajenos.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-[10px] uppercase tracking-wide text-white/55">
              Fecha de análisis
            </p>

            <p className="text-[13px] font-medium">
              {fechaTexto}
            </p>
          </div>

          <button
            type="button"
            onClick={onVolver}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/25 bg-white px-4 py-2 text-xs font-semibold text-vw transition-colors hover:bg-blue-50"
          >
            <RefreshCw size={14} />
            Volver a analizar
          </button>

          <button
            type="button"
            onClick={generarReporte}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/25 bg-[#0b2f6b] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#12408f]"
          >
            <Download size={14} />
            Generar reporte
          </button>
        </div>
      </div>

            {/* RESUMEN GENERAL Y FOTOGRAFÍAS */}
              <div className="px-4 py-4 sm:px-5 sm:py-5">
                <div className="space-y-4">

                  {/* RESUMEN GENERAL A TODO LO ANCHO */}
                  <div className="relative overflow-hidden rounded-xl border border-vw-borde bg-white p-4 sm:p-5">
                    <img
                      src="/vw.png"
                      alt=""
                      aria-hidden="true"
                      className="pointer-events-none absolute -bottom-6 right-4 w-44 opacity-[0.05]"
                    />

                    <div className="relative">
                      <h3 className="mb-4 text-base font-semibold text-vw sm:text-lg">
                        Resumen general
                      </h3>

                      <div className="grid gap-3 sm:grid-cols-3">
                        {fichas.map((ficha) => (
                          <Ficha key={ficha.etiqueta} {...ficha} />
                        ))}
                      </div>

                      {/* Datos distribuidos en dos columnas: 4 a la izquierda y 3 a la derecha. */}
                      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
                        {[meta.slice(0, 4), meta.slice(4)].map((columna, indice) => (
                          <ul
                            key={indice}
                            className="min-w-0 rounded-xl border border-vw-borde bg-white px-4 py-1"
                          >
                            {columna.map((dato) => (
                              <Dato key={dato.etiqueta} {...dato} />
                            ))}
                          </ul>
                        ))}
                      </div>

                      {resumenGeneral && (
                        <p className="mt-5 rounded-xl bg-vw-claro p-4 text-[14px] leading-7 text-slate-700 sm:text-[15px]">
                          {resumenGeneral}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* FOTOGRAFÍAS ANALIZADAS A TODO LO ANCHO */}
                  <div className="rounded-xl border border-vw-borde bg-white p-4 sm:p-5">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <h3 className="text-base font-semibold text-vw sm:text-lg">
                        Fotografías analizadas ({fotosAnalizadas.length}) ·{" "}
                        {danos.length + objetos.length} hallazgos
                      </h3>

                      <label className="flex items-center gap-2 text-[12px] text-slate-500 sm:text-[13px]">
                        Ordenar daños por:

                        <span className="relative">
                          <select
                            value={orden}
                            onChange={(evento) => setOrden(evento.target.value)}
                            className="appearance-none rounded-lg border border-vw-borde bg-white py-2 pl-3 pr-8 text-[12px] font-semibold text-vw outline-none focus:border-vw-azul sm:text-[13px]"
                          >
                            <option value="gravedad">Gravedad</option>
                            <option value="pieza">Pieza</option>
                            <option value="original">Orden original</option>
                          </select>

                          <ChevronDown
                            size={14}
                            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                          />
                        </span>
                      </label>
                    </div>

                    {fotosOrdenadas.length === 0 ? (
                      <p className="rounded-lg bg-vw-claro p-4 text-[14px] text-slate-600">
                        Todavía no existen fotografías con análisis guardado.
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {fotosOrdenadas.map((foto) => {
                          const imagenLista = Boolean(foto.analisis?.imagen_url || foto.analisis?.imagen_resultado);
                          const src = foto.evidencia?.url || foto.analisis?.imagen_url;

                          return (
                            <section
                              key={foto.clave}
                              className="overflow-hidden rounded-xl border border-vw-borde bg-[#f8fafc]"
                            >
                              {/* Encabezado de la fotografía */}
                              <div className="flex flex-wrap items-center gap-3 border-b border-vw-borde bg-white p-3.5 sm:p-4">
                                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-vw-azul text-xs font-bold text-white">
                                  {foto.numero}
                                </span>

                                {src && (
                                  <button
                                    type="button"
                                    onClick={() => verFoto(foto)}
                                    aria-label={`Ver fotografía ${foto.numero}`}
                                    className="h-16 w-24 shrink-0 overflow-hidden rounded-lg border border-vw-borde"
                                  >
                                    <img
                                      src={src}
                                      alt=""
                                      loading="lazy"
                                      className="h-full w-full object-cover"
                                    />
                                  </button>
                                )}

                                <div className="min-w-0 flex-1">
                                  <h4 className="break-all text-[14px] font-semibold text-vw sm:text-[15px]">
                                    Foto {foto.numero}:{" "}
                                    {foto.evidencia?.nombre_original || "Evidencia sin nombre"}
                                  </h4>

                                  <p className="mt-1 text-[12px] text-slate-500 sm:text-[13px]">
                                    {foto.danos.length} {foto.danos.length === 1 ? "daño" : "daños"} ·{" "}
                                    {foto.objetos.length}{" "}
                                    {foto.objetos.length === 1 ? "objeto ajeno" : "objetos ajenos"}
                                  </p>
                                  {!imagenLista && (
                                    <p role="status" className="mt-1.5 text-[12px] font-semibold text-amber-700">
                                      {analizando
                                        ? "Reporte listo · Generando imagen anotada…"
                                        : "Reporte listo · Imagen anotada pendiente"}
                                    </p>
                                  )}
                                </div>

                                <button
                                  type="button"
                                  onClick={() => verFoto(foto)}
                                  disabled={!foto.analisis?.imagen_url && !foto.evidencia?.url}
                                  className="rounded-lg border border-vw-borde bg-white px-3 py-2 text-[12px] font-semibold text-vw-azul hover:bg-vw-claro disabled:opacity-50 sm:text-[13px]"
                                >
                                  Ver evidencia
                                </button>
                              </div>

                              {/* Contenido de la fotografía */}
                              <div className="space-y-4 p-3.5 sm:p-4">
                                {foto.danos.length > 0 && (
                                  <div>
                                    <p className="mb-3 text-sm font-semibold text-vw sm:text-[15px]">
                                      Daños por pieza y ubicación
                                    </p>

                                    <ol className="list-decimal space-y-3 pl-5">
                                      {foto.danos.map((dano, indice) => {
                                        const tono = estiloTono(dano.severidad);

                                        return (
                                          <li
                                            key={`d-${indice}`}
                                            className="pl-1 text-[13px] leading-6 text-slate-700 sm:text-[14px]"
                                          >
                                            <div className="flex flex-wrap items-center gap-2">
                                              <span className="font-semibold text-vw">
                                                {dano.pieza || "Pieza no identificada"}
                                                {dano.tipo ? ` · ${dano.tipo}` : ""}
                                              </span>

                                              {dano.severidad && (
                                                <Etiqueta color={tono.badge}>
                                                  {dano.severidad}
                                                </Etiqueta>
                                              )}
                                            </div>

                                            {dano.descripcion && (
                                              <p className="mt-1 leading-6 text-slate-700">
                                                {dano.descripcion}
                                              </p>
                                            )}

                                            {(dano.ubicacion || dano.certeza) && (
                                              <p className="mt-1 text-[12px] text-slate-500 sm:text-[13px]">
                                                {dano.ubicacion && (
                                                  <>
                                                    Ubicación: {dano.ubicacion}
                                                  </>
                                                )}
                                                {dano.ubicacion && dano.certeza && " · "}
                                                {dano.certeza && <>Certeza: {dano.certeza}</>}
                                              </p>
                                            )}
                                          </li>
                                        );
                                      })}
                                    </ol>
                                  </div>
                                )}

                                {foto.objetos.length > 0 && (
                                  <div className={foto.danos.length ? "border-t border-vw-borde pt-4" : ""}>
                                    <p className="mb-3 text-sm font-semibold text-vw sm:text-[15px]">
                                      Objetos ajenos detectados
                                    </p>

                                    <ol className="list-decimal space-y-3 pl-5">
                                      {foto.objetos.map((objeto, indice) => (
                                        <li
                                          key={`o-${indice}`}
                                          className="pl-1 text-[13px] leading-6 text-slate-700 sm:text-[14px]"
                                        >
                                          <div className="flex flex-wrap items-center gap-2">
                                            <span className="font-semibold text-vw">
                                              {objeto.objeto || "Objeto no identificado"}
                                            </span>

                                            <Etiqueta color="border-orange-200 bg-orange-50 text-orange-700">
                                              Objeto ajeno
                                            </Etiqueta>
                                          </div>

                                          {objeto.descripcion && (
                                            <p className="mt-1 leading-6 text-slate-700">
                                              {objeto.descripcion}
                                            </p>
                                          )}

                                          {(objeto.ubicacion || objeto.certeza) && (
                                            <p className="mt-1 text-[12px] text-slate-500 sm:text-[13px]">
                                              {objeto.ubicacion && (
                                                <>
                                                  Ubicación: {objeto.ubicacion}
                                                </>
                                              )}
                                              {objeto.ubicacion && objeto.certeza && " · "}
                                              {objeto.certeza && <>Certeza: {objeto.certeza}</>}
                                            </p>
                                          )}
                                        </li>
                                      ))}
                                    </ol>
                                  </div>
                                )}

                                {foto.danos.length === 0 && foto.objetos.length === 0 && (
                                  <p className="text-[13px] text-slate-500 sm:text-[14px]">
                                    No se registraron incidencias confirmadas en esta fotografía.
                                  </p>
                                )}
                              </div>
                            </section>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

      {/* LIMITACIONES */}

      <div className="px-4 pb-4 sm:px-5 sm:pb-5">
        <Seccion
          titulo="Limitaciones del análisis"
          elementos={limitacionesUnicas}
          icono={CircleHelp}
        />
      </div>

    </Tarjeta>
  );
}