import { useEffect, useState } from "react";
import {
  Camera,
  Check,
  ChevronDown,
  Eye,
  FileImage,
  Film,
  FolderUp,
  ImagePlus,
  List,
  LoaderCircle,
  Plus,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { Tarjeta } from "./Tarjeta.jsx";

const ORDENES = [
  { id: "reciente", etiqueta: "Más recientes" },
  { id: "nombre", etiqueta: "Por nombre" },
  { id: "fecha", etiqueta: "Por fecha" },
];

const BANDA = "bg-[linear-gradient(100deg,#06183b_0%,#0a2a63_100%)]";

const BASE_ARRASTRE =
  "border-2 border-dashed border-[#c3d6ee] transition-all hover:border-vw-azul/70";
const ACTIVO_ARRASTRE =
  "!border-vw-azul !bg-blue-50 shadow-[0_0_0_4px_rgba(0,114,206,0.10)]";

function formatearTamano(bytes) {
  if (!Number.isFinite(bytes)) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatearFecha(millisegundos) {
  if (!millisegundos) return "";
  return new Intl.DateTimeFormat("es-MX", { dateStyle: "short", timeStyle: "short" }).format(
    new Date(millisegundos),
  );
}

export default function CargaEvidencia({
  archivos,
  maxImagenes,
  arrastrando,
  procesando,
  bloqueado,
  cita,
  inputRef,
  onNuevos,
  onArrastrando,
  onCamara,
  onEliminar,
  onLimpiar,
}) {
  const [menu, setMenu] = useState(null);
  const [orden, setOrden] = useState("reciente");
  const [previo, setPrevio] = useState(null);

  const lleno = archivos.length >= maxImagenes;
  const vacio = archivos.length === 0;
  const porcentaje = Math.min(100, Math.round((archivos.length / maxImagenes) * 100));

  const visibles = [...archivos];
  if (orden === "nombre") visibles.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  if (orden === "fecha")
    visibles.sort((a, b) => (a.archivo?.lastModified || 0) - (b.archivo?.lastModified || 0));

  const arrastre = {
    onDragOver: (evento) => {
      evento.preventDefault();
      if (!bloqueado) {
        evento.dataTransfer.dropEffect = "copy";
        onArrastrando(true);
      }
    },
    onDragLeave: (evento) => {
      if (!evento.currentTarget.contains(evento.relatedTarget)) onArrastrando(false);
    },
    onDrop: (evento) => {
      evento.preventDefault();
      onArrastrando(false);
      if (!bloqueado) onNuevos(Array.from(evento.dataTransfer.files || []));
    },
  };

  const claseZona = `${BASE_ARRASTRE} ${arrastrando ? ACTIVO_ARRASTRE : "bg-white"}`;

  useEffect(() => {
    if (!previo) return undefined;
    const cerrar = (evento) => {
      if (evento.key === "Escape") setPrevio(null);
    };
    window.addEventListener("keydown", cerrar);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", cerrar);
      document.body.style.overflow = "";
    };
  }, [previo]);

  return (
    <>
      <Tarjeta className="overflow-hidden">
        {menu && (
          <div
            className="fixed inset-0 z-10"
            onClick={() => setMenu(null)}
            onKeyUp={(evento) => evento.key === "Escape" && setMenu(null)}
            aria-hidden="true"
          />
        )}
  
        <div className="px-5 pt-5 sm:px-6">
          <div className="h-1.5 overflow-hidden rounded-full bg-vw-claro">
            <div
              className="h-full rounded-full bg-gradient-to-r from-vw-azul to-[#5eb0f7] transition-[width] duration-500"
              style={{ width: `${porcentaje}%` }}
            />
          </div>
        </div>
  
        <div className="px-5 pb-5 pt-4 sm:px-6 sm:pb-6 sm:pt-5">
          <div className="overflow-hidden rounded-2xl border border-vw-borde bg-[#f7fafc]">
            <div
              className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 text-white sm:px-5 ${BANDA}`}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/15">
                  <FolderUp size={18} />
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold leading-tight sm:text-sm">
                    Carga de evidencia
                  </p>
                <p className="mt-0.5 truncate text-[11px] leading-tight text-white/70">
                  {cita
                    ? `Evidencias de ${cita.folio}${cita.unidad ? ` · ${cita.unidad}` : ""}`
                    : "Arrastra o selecciona fotos y videos del vehículo."}
                </p>
                </div>
              </div>
  
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                    lleno ? "bg-amber-300 text-amber-950" : "bg-white/15 text-white"
                  }`}
                >
                  <ImagePlus size={12} />
                  {archivos.length} / {maxImagenes}
                </span>
  
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setMenu(menu === "orden" ? null : "orden")}
                    aria-haspopup="menu"
                    aria-expanded={menu === "orden"}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-vw transition-colors hover:bg-blue-50"
                  >
                    <List size={14} /> Ordenar
                    <ChevronDown
                      size={13}
                      className={`transition-transform ${menu === "orden" ? "rotate-180" : ""}`}
                    />
                  </button>
                  {menu === "orden" && (
                    <div className="absolute right-0 top-full z-20 mt-1.5 w-40 overflow-hidden rounded-lg border border-vw-borde bg-white py-1 shadow-lg">
                      {ORDENES.map((opcion) => (
                        <button
                          key={opcion.id}
                          type="button"
                          onClick={() => {
                            setOrden(opcion.id);
                            setMenu(null);
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-vw hover:bg-vw-claro"
                        >
                          <span className="w-3 shrink-0">
                            {orden === opcion.id && <Check size={13} className="text-vw-azul" />}
                          </span>
                          {opcion.etiqueta}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
  
                <button
                  type="button"
                  disabled={bloqueado || vacio}
                  onClick={() => {
                    setMenu(null);
                    onLimpiar();
                  }}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-50"
                >
                  <Trash2 size={14} /> Eliminar todos
                </button>
              </div>
            </div>
  
            <div className="p-4 sm:p-5">
              {vacio ? (
                <div
                  {...arrastre}
                  className={`flex min-h-[210px] flex-col items-center justify-center rounded-2xl px-4 py-8 text-center ${claseZona}`}
                >
                  <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-vw-azul to-[#0b3d91] text-white shadow-lg shadow-vw-azul/25">
                    <UploadCloud size={28} />
                  </span>
                  <p className="mt-3.5 text-[15px] font-semibold text-vw">
                    Arrastra tus fotos o videos aquí
                  </p>
                  <p className="mt-1 text-xs text-slate-500">o selecciónalos desde tu dispositivo</p>
  
                  <div className="mt-4 flex w-full max-w-sm flex-col justify-center gap-2.5 sm:flex-row">
                    <button
                      type="button"
                      disabled={bloqueado}
                      onClick={() => inputRef.current?.click()}
                      className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-vw-btn px-4 py-2 text-sm font-semibold text-white shadow-md shadow-vw-btn/25 transition-all hover:bg-vw-btn-alt disabled:opacity-50 disabled:shadow-none"
                    >
                      <ImagePlus size={16} /> Seleccionar archivos
                    </button>
                    <button
                      type="button"
                      disabled={bloqueado}
                      onClick={onCamara}
                      className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-[#c3d6ee] bg-white px-4 py-2 text-sm font-semibold text-vw transition-colors hover:border-vw-azul hover:bg-vw-claro disabled:opacity-50"
                    >
                      <Camera size={16} /> Tomar foto
                    </button>
                  </div>
  
                  <p className="mt-3.5 text-[11px] leading-relaxed text-slate-400">
                    JPG · PNG · WEBP · MP4 — 8 MB por foto · 80 MB por video
                  </p>
                </div>
              ) : (
                <>
                  <div
                    {...arrastre}
                    className={`flex flex-wrap items-center gap-x-3 gap-y-2.5 rounded-xl px-3.5 py-2.5 ${claseZona}`}
                  >
                    <span
                      className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg text-white ${
                        arrastrando
                          ? "bg-vw-azul"
                          : "bg-gradient-to-br from-vw-azul to-[#0b3d91] shadow-sm"
                      }`}
                    >
                      <UploadCloud size={17} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold leading-tight text-vw">
                        Arrastra más archivos aquí
                      </p>
                      <p className="mt-0.5 text-[11px] leading-tight text-slate-500">
                        JPG · PNG · WEBP · MP4
                      </p>
                    </div>
  
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={bloqueado || lleno}
                        onClick={() => inputRef.current?.click()}
                        className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-vw-btn px-3 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-vw-btn-alt disabled:opacity-50"
                      >
                        <ImagePlus size={14} /> Seleccionar
                      </button>
                      <button
                        type="button"
                        disabled={bloqueado || lleno}
                        onClick={onCamara}
                        className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[#c3d6ee] bg-white px-3 py-2 text-xs font-semibold text-vw transition-colors hover:border-vw-azul hover:bg-vw-claro disabled:opacity-50"
                      >
                        <Camera size={14} /> Tomar foto
                      </button>
                    </div>
                  </div>
  
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                    {visibles.map((archivo) => {
                      const desdeVideo = archivo.origen === "Video";
                      const metainfo = [
                        formatearTamano(archivo.archivo?.size),
                        formatearFecha(archivo.archivo?.lastModified),
                      ]
                        .filter(Boolean)
                        .join(" · ");
  
                      return (
                        <figure
                          key={archivo.id}
                          className="group relative overflow-hidden rounded-xl border border-vw-borde bg-white shadow-sm transition-shadow hover:shadow-md"
                        >
                          <div className="relative aspect-[4/3] overflow-hidden bg-vw-claro">
                            <img
                              src={archivo.vista}
                              alt={archivo.nombre}
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
  
                            <button
                              type="button"
                              disabled={bloqueado}
                              onClick={() => onEliminar(archivo.id)}
                              aria-label={`Eliminar ${archivo.nombre}`}
                              title="Eliminar evidencia"
                              className="absolute left-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-white/95 text-rose-600 shadow-md transition-colors hover:bg-rose-600 hover:text-white disabled:opacity-50"
                            >
                              <X size={15} strokeWidth={3} />
                            </button>
  
                            <button
                              type="button"
                              onClick={() => setPrevio(archivo)}
                              aria-label={`Ver ${archivo.nombre}`}
                              title="Ver evidencia"
                              className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-white/95 text-vw shadow-md transition-colors hover:bg-vw hover:text-white"
                            >
                              <Eye size={15} />
                            </button>
  
                            <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-vw/95 via-vw/75 to-transparent px-2.5 pb-2.5 pt-8">
                              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/15 text-white">
                                {desdeVideo ? <Film size={14} /> : <FileImage size={14} />}
                              </span>
                              <span className="min-w-0">
                                <span className="block truncate text-[11px] font-semibold text-white">
                                  {archivo.nombre}
                                </span>
                                {metainfo && (
                                  <span className="block truncate text-[10px] text-white/70">
                                    {metainfo}
                                  </span>
                                )}
                              </span>
                            </div>
                          </div>
                        </figure>
                      );
                    })}
  
                    <button
                      type="button"
                      disabled={bloqueado || lleno}
                      onClick={() => inputRef.current?.click()}
                      className={`flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-3 transition-colors disabled:opacity-50 ${
                        lleno
                          ? "border-[#e2e8f0] bg-slate-50 text-slate-400"
                          : "border-[#c3d6ee] bg-white text-slate-500 hover:border-vw-azul hover:text-vw-azul"
                      }`}
                    >
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-vw-claro text-vw-azul">
                        <Plus size={20} />
                      </span>
                      <span className="text-center text-[11px] leading-tight">Agregar más</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
  
        {procesando && (
          <div
            role="status"
            className="mx-5 mb-5 flex items-center gap-3 rounded-xl border border-[#cfe1f5] bg-vw-claro px-4 py-3 sm:mx-6 sm:mb-6"
          >
            <LoaderCircle size={16} className="shrink-0 animate-spin text-vw-azul" />
            <p className="text-[13px] text-slate-600">Extrayendo fotogramas del video…</p>
          </div>
        )}
      </Tarjeta>

      {previo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#04122e]/80 p-3 backdrop-blur-sm sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label={`Vista previa de ${previo.nombre}`}
          onClick={() => setPrevio(null)}
        >
          <div
            className="flex max-h-full w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(evento) => evento.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-vw-borde px-4 py-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-vw-claro text-vw-azul">
                  {previo.origen === "Video" ? <Film size={16} /> : <FileImage size={16} />}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-vw">{previo.nombre}</p>
                  <p className="truncate text-[11px] text-slate-500">
                    {[
                      formatearTamano(previo.archivo?.size),
                      formatearFecha(previo.archivo?.lastModified),
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPrevio(null)}
                aria-label="Cerrar vista previa"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-vw-claro hover:text-vw"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex min-h-0 flex-1 items-center justify-center bg-[#0b1526] p-2 sm:p-3">
              <img
                src={previo.vista}
                alt={previo.nombre}
                className="max-h-[72vh] w-auto max-w-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
