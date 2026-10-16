import { useEffect, useRef, useState } from "react";
import {
  AlertCircle, ArrowRight, Camera, CircleHelp, ClipboardCheck,
  ImagePlus, LoaderCircle, RotateCcw, SearchCheck, ShieldAlert,
  Sparkles, UploadCloud, X,
} from "lucide-react";
import { extraerFotogramas } from "./lib/extraerFotogramas.js";

const MAX_IMAGENES = 12;
const MAX_VIDEO = 80 * 1024 * 1024;
const MAX_FOTO = 8 * 1024 * 1024;
const formatosImagen = ["image/jpeg", "image/png", "image/webp"];

const estilosEstado = {
  "Sin daños visibles": "border-emerald-200 bg-emerald-50 text-emerald-800",
  "Posibles daños": "border-amber-200 bg-amber-50 text-amber-800",
  "Daños visibles": "border-rose-200 bg-rose-50 text-rose-800",
  "No concluyente": "border-vw-borde bg-vw-claro text-vw",
};

function Etiqueta({ children, color = "border-vw-borde bg-vw-claro text-vw" }) {
  return (
    <span className={`inline-flex max-w-full items-center rounded-full border px-3 py-1 text-xs font-medium ${color}`}>
      {children}
    </span>
  );
}

function Seccion({ titulo, elementos, icono: Icono }) {
  if (!elementos?.length) return null;

  return (
    <section className="min-w-0 rounded-2xl border border-vw-borde bg-white p-5 shadow-sm sm:p-6">
      <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-vw">
        <Icono size={18} className="shrink-0 text-vw-azul" />
        {titulo}
      </h3>
      <ul className="space-y-3 text-sm leading-relaxed text-slate-600">
        {elementos.map((texto, indice) => (
          <li key={indice} className="flex min-w-0 gap-3">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-vw-azul" />
            <span className="min-w-0 break-words">{texto}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Resultado({ resultado }) {
  const danos = resultado.danos || [];

  return (
    <div className="space-y-5" aria-live="polite">
      <section className="min-w-0 rounded-2xl border border-vw-borde bg-gradient-to-br from-vw-claro via-white to-white p-5 shadow-sm sm:p-7">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Etiqueta color={estilosEstado[resultado.estado_general] || estilosEstado["No concluyente"]}>
            {resultado.estado_general}
          </Etiqueta>
          <Etiqueta>Atención: {resultado.nivel_atencion}</Etiqueta>
          <Etiqueta>{resultado.total_imagenes} imágenes analizadas</Etiqueta>
        </div>
        <h2 className="mb-2 text-xl font-bold text-vw">Resumen de la inspección</h2>
        <p className="break-words leading-relaxed text-slate-600">{resultado.resumen_general}</p>
      </section>

      <section className="min-w-0 rounded-2xl border border-vw-borde bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 font-semibold text-vw">
            <SearchCheck size={19} className="shrink-0 text-vw-azul" />
            Hallazgos visuales
          </h3>
          <Etiqueta>{danos.length} hallazgo(s)</Etiqueta>
        </div>
        {danos.length === 0 ? (
          <p className="rounded-xl bg-vw-claro p-4 text-sm leading-relaxed text-slate-600">
            No se identificaron daños suficientemente claros en las imágenes proporcionadas.
            Esto no descarta daños en zonas no visibles.
          </p>
        ) : (
          <div className="space-y-3">
            {danos.map((dano, indice) => (
              <div key={indice} className="min-w-0 rounded-xl border border-vw-borde bg-vw-claro/50 p-4">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <h4 className="min-w-0 break-words font-semibold text-vw">
                    {dano.pieza} · {dano.tipo}
                  </h4>
                  <Etiqueta color="border-amber-200 bg-amber-50 text-amber-800">
                    {dano.severidad}
                  </Etiqueta>
                </div>
                <p className="break-words text-sm leading-relaxed text-slate-600">{dano.descripcion}</p>
                <p className="mt-2 break-words text-xs text-slate-500">Evidencia: {dano.evidencia}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-5 md:grid-cols-2">
        <Seccion titulo="Recomendaciones" elementos={resultado.recomendaciones} icono={ClipboardCheck} />
        <Seccion titulo="Limitaciones del análisis" elementos={resultado.limitaciones} icono={CircleHelp} />
      </div>
      <Seccion titulo="Zonas no evaluadas" elementos={resultado.zonas_no_evaluadas} icono={ShieldAlert} />
    </div>
  );
}

export default function App() {
  const [archivos, setArchivos] = useState([]);
  const [procesando, setProcesando] = useState(false);
  const [analizando, setAnalizando] = useState(false);
  const [arrastrando, setArrastrando] = useState(false);
  const [error, setError] = useState("");
  const [resultado, setResultado] = useState(null);
  const selectorRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const urlsRef = useRef(new Set());
  const [camaraAbierta, setCamaraAbierta] = useState(false);
  const [camaraLista, setCamaraLista] = useState(false);
  const [capturando, setCapturando] = useState(false);
  const [errorCamara, setErrorCamara] = useState("");
  const API_BASE = (import.meta.env.VITE_API_BASE || "https://crm.grupoautomotrizryr.com").replace(/\/$/, "");

  useEffect(() => () => {
    for (const url of urlsRef.current) URL.revokeObjectURL(url);
    urlsRef.current.clear();
  }, []);

  useEffect(() => {
    if (!camaraAbierta) return;

    let activo = true;

    async function iniciarCamara() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("Tu navegador no permite abrir la cámara. Usa HTTPS o localhost.");
        }

        const flujo = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: "environment" } },
        });

        if (!activo) {
          flujo.getTracks().forEach((pista) => pista.stop());
          return;
        }

        streamRef.current = flujo;
        if (videoRef.current) {
          videoRef.current.srcObject = flujo;
          await videoRef.current.play();
        }
        if (activo) setCamaraLista(true);
      } catch (e) {
        if (activo) {
          setErrorCamara(
            e.name === "NotAllowedError"
              ? "Permite el acceso a la cámara en tu navegador para tomar fotografías."
              : "No se pudo abrir la cámara. Comprueba sus permisos o utiliza Seleccionar archivos."
          );
        }
      }
    }

    iniciarCamara();

    return () => {
      activo = false;
      streamRef.current?.getTracks().forEach((pista) => pista.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, [camaraAbierta]);

  function abrirCamara() {
    if (procesando || analizando || archivos.length >= MAX_IMAGENES) return;
    setErrorCamara("");
    setCamaraLista(false);
    setCamaraAbierta(true);
  }

  function cerrarCamara() {
    setCamaraAbierta(false);
    setCamaraLista(false);
    setErrorCamara("");
  }

  async function tomarFoto() {
    const video = videoRef.current;
    if (!camaraLista || !video?.videoWidth || capturando || procesando || archivos.length >= MAX_IMAGENES) return;

    setCapturando(true);
    setErrorCamara("");

    try {
      const escala = Math.min(1, 2000 / Math.max(video.videoWidth, video.videoHeight));
      const lienzo = document.createElement("canvas");
      lienzo.width = Math.round(video.videoWidth * escala);
      lienzo.height = Math.round(video.videoHeight * escala);
      const contexto = lienzo.getContext("2d");
      if (!contexto) throw new Error("No se pudo preparar la fotografía.");
      contexto.drawImage(video, 0, 0, lienzo.width, lienzo.height);

      const imagen = await new Promise((resolver) => {
        lienzo.toBlob(resolver, "image/jpeg", 0.9);
      });
      if (!imagen) throw new Error("No se pudo capturar la fotografía.");

      const archivo = new File([imagen], `foto-auto-${Date.now()}.jpg`, { type: "image/jpeg" });
      await agregarArchivos([archivo]);
    } catch (e) {
      setErrorCamara(e.message);
    } finally {
      setCapturando(false);
    }
  }

  function generarVista(archivo) {
    const url = URL.createObjectURL(archivo);
    urlsRef.current.add(url);
    return url;
  }

  async function agregarArchivos(seleccion) {
    if (procesando || analizando || seleccion.length === 0) return;
    setError("");
    setResultado(null);
    setProcesando(true);
    const nuevos = [];

    try {
      let espacios = MAX_IMAGENES - archivos.length;
      if (espacios <= 0) throw new Error("Ya alcanzaste el máximo de 12 imágenes o fotogramas.");

      for (const archivo of seleccion) {
        if (espacios <= 0) throw new Error("Se alcanzó el máximo de 12 imágenes; no se añadieron los archivos restantes.");
        if (formatosImagen.includes(archivo.type)) {
          if (archivo.size > MAX_FOTO) throw new Error(`${archivo.name}: la fotografía supera 8 MB.`);
          nuevos.push({ id: crypto.randomUUID(), archivo, nombre: archivo.name, origen: "Fotografía", vista: generarVista(archivo) });
          espacios--;
        } else if (archivo.type.startsWith("video/")) {
          if (archivo.size > MAX_VIDEO) throw new Error(`${archivo.name}: el video supera 80 MB.`);
          const capturas = await extraerFotogramas(archivo, Math.min(6, espacios));
          for (const captura of capturas) {
            nuevos.push({ ...captura, id: crypto.randomUUID(), vista: generarVista(captura.archivo) });
            espacios--;
          }
        } else {
          throw new Error(`${archivo.name}: formato no compatible. Usa JPG, PNG, WEBP o un video que pueda reproducir tu navegador.`);
        }
      }
    } catch (e) {
      setError(e.message);
    } finally {
      if (nuevos.length) setArchivos((actuales) => [...actuales, ...nuevos]);
      setProcesando(false);
      if (selectorRef.current) selectorRef.current.value = "";
    }
  }

  function eliminarArchivo(id) {
    const elemento = archivos.find((archivo) => archivo.id === id);
    if (elemento) {
      URL.revokeObjectURL(elemento.vista);
      urlsRef.current.delete(elemento.vista);
    }
    setArchivos((actuales) => actuales.filter((archivo) => archivo.id !== id));
    setResultado(null);
  }

  function limpiar() {
    for (const archivo of archivos) {
      URL.revokeObjectURL(archivo.vista);
      urlsRef.current.delete(archivo.vista);
    }
    setArchivos([]);
    setResultado(null);
    setError("");
  }


  async function analizar() {
    if (!archivos.length || procesando || analizando) return;

    setAnalizando(true);
    setResultado(null);
    setError("");

    try {
      const formulario = new FormData();

      for (const archivo of archivos) {
        formulario.append("imagenes", archivo.archivo);
        formulario.append("etiquetas", archivo.nombre);
      }

      const respuesta = await fetch(
        `${API_BASE}/inspector-ai/api/analizar/`,
        {
          method: "POST",
          body: formulario,
        },
      );

      const datos = await respuesta.json().catch(() => ({}));

      if (!respuesta.ok) {
        throw new Error(
          datos.error ||
          datos.detail ||
          "No se pudo analizar el vehículo. Comprueba que Django esté ejecutándose."
        );
      }

      setResultado(datos);
    } catch (e) {
      setError(e.message);
    } finally {
      setAnalizando(false);
    }
  }

  const bloqueado = procesando || analizando;

  return (
    <div className="min-h-screen bg-white text-slate-700">
      <header className="border-b border-vw-borde bg-white">
        <div className="mx-auto flex max-w-[90%] flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="shrink-0 rounded-xl border border-vw-borde bg-vw-claro text-vw">
              <img src="/vw_dark.png" alt="Logo VW" className="object-contain w-15 h-15 " />
            </div>
            <div className="min-w-0">
              <p className="text-base font-bold tracking-tight text-vw sm:text-lg">
                AutoInspect <span className="text-vw-azul">AI</span>
              </p>
              <p className="text-[10px] font-medium tracking-wide text-slate-500 sm:text-[11px]">
                INSPECCIÓN VISUAL AUTOMOTRIZ
              </p>
            </div>
          </div>
          <Etiqueta color="border-vw-borde bg-vw-claro text-vw">
            <span className="mr-2 h-1.5 w-1.5 shrink-0 rounded-full bg-vw-azul" />
            <span className="sm:hidden">Análisis con IA</span>
            <span className="hidden sm:inline">Análisis asistido por IA</span>
          </Etiqueta>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[90%] px-4 pb-14 pt-8 sm:px-6 sm:pt-10 lg:px-8 lg:pb-16">
        <div className="mb-7 max-w-4xl sm:mb-9">
          <h1 className="text-[clamp(1.8rem,5vw,3rem)] font-bold leading-tight tracking-tight text-vw">
            Detecta posibles daños exteriores{" "}
            <span className="text-vw-azul">desde fotografías o videos.</span>
          </h1>
        </div>

        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0 space-y-5 sm:space-y-6">
            <section className="min-w-0 rounded-2xl border border-vw-borde bg-white p-4 shadow-sm sm:p-6 lg:p-7">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-vw sm:text-lg">01. Cargar evidencia visual</h2>
                <Etiqueta>{archivos.length} / {MAX_IMAGENES}</Etiqueta>
              </div>

              <input
                ref={selectorRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,video/*"
                multiple
                className="hidden"
                onChange={(e) => agregarArchivos(Array.from(e.target.files || []))}
                aria-label="Seleccionar fotografías y videos"
              />

              <div
                onDragOver={(e) => { e.preventDefault(); if (!bloqueado) setArrastrando(true); }}
                onDragLeave={(e) => { e.preventDefault(); setArrastrando(false); }}
                onDrop={(e) => {
                  e.preventDefault();
                  setArrastrando(false);
                  if (!bloqueado) agregarArchivos(Array.from(e.dataTransfer.files));
                }}
                className={`rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-colors sm:px-8 sm:py-11 ${arrastrando ? "border-vw-azul bg-blue-100" : "border-[#b8cfe8] bg-vw-claro"
                  }`}
              >
                <div className="mx-auto mb-5 w-fit rounded-2xl bg-white p-4 text-vw-azul shadow-sm">
                  <UploadCloud size={33} />
                </div>
                <p className="text-base font-semibold text-vw">Arrastra las imágenes o videos aquí</p>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-600">
                  JPG, PNG, WEBP, MP4 o videos compatibles con tu navegador
                </p>
                <div className="mx-auto mt-6 grid w-full max-w-md grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    disabled={bloqueado || archivos.length >= MAX_IMAGENES}
                    onClick={abrirCamara}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-vw px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#003681] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Camera size={19} /> Tomar foto
                  </button>
                  <button
                    type="button"
                    disabled={bloqueado || archivos.length >= MAX_IMAGENES}
                    onClick={() => selectorRef.current?.click()}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-vw bg-white px-5 py-3 text-sm font-semibold text-vw transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ImagePlus size={19} /> Seleccionar archivos
                  </button>
                </div>
                <p className="mt-4 text-xs leading-relaxed text-slate-500">
                  Máximo 12 imágenes/capturas · 8 MB por foto · 80 MB por video
                </p>
              </div>

              {procesando && (
                <p className="mt-4 flex items-center gap-2 text-sm text-vw-azul" role="status">
                  <LoaderCircle size={17} className="animate-spin" /> Extrayendo fotogramas del video...
                </p>
              )}

              {archivos.length > 0 && (
                <div className="mt-7">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-vw">Evidencia preparada para el análisis</h3>
                    <button
                      type="button"
                      disabled={bloqueado}
                      onClick={limpiar}
                      className="min-h-10 text-xs font-medium text-slate-600 hover:text-rose-700 disabled:opacity-50"
                    >
                      Eliminar todo
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {archivos.map((archivo, indice) => (
                      <div key={archivo.id} className="group relative min-w-0 overflow-hidden rounded-xl border border-vw-borde bg-white">
                        <img src={archivo.vista} alt={`Evidencia ${indice + 1}`} className="aspect-[4/3] w-full object-cover" />
                        <div className="absolute left-2 top-2 max-w-[70%] truncate rounded-lg bg-vw/90 px-2 py-1 text-[10px] font-medium text-white">
                          #{indice + 1} · {archivo.origen === "Video" ? "Video" : "Foto"}
                        </div>
                        <button
                          type="button"
                          disabled={bloqueado}
                          onClick={() => eliminarArchivo(archivo.id)}
                          aria-label={`Eliminar evidencia ${indice + 1}`}
                          className="absolute right-1 top-1 flex h-9 w-9 items-center justify-center rounded-lg bg-vw/90 text-white transition-colors hover:bg-rose-600 disabled:opacity-50 sm:right-2 sm:top-2"
                        >
                          <X size={16} />
                        </button>
                        <p title={archivo.nombre} className="truncate px-3 py-2 text-xs text-slate-600">{archivo.nombre}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <section className="min-w-0 rounded-2xl border border-vw-borde bg-white p-4 shadow-sm sm:p-6 lg:p-7">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-vw sm:text-lg">02. Ejecutar inspección</h2>
                <SearchCheck size={22} className="shrink-0 text-vw-azul" />
              </div>
              <p className="mb-5 text-sm leading-relaxed text-slate-600">
                Las fotografías seleccionadas y los fotogramas de los videos se analizarán juntos para generar un reporte visual estructurado.
              </p>
              <button
                type="button"
                disabled={bloqueado || archivos.length === 0}
                onClick={analizar}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-vw px-4 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#003681] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vw-azul disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 sm:gap-3 sm:px-5 sm:text-base"
              >
                {analizando ? (
                  <><LoaderCircle size={19} className="shrink-0 animate-spin" /> Analizando evidencia...</>
                ) : (
                  <><Sparkles size={19} className="shrink-0" /> Analizar vehículo <ArrowRight size={19} className="shrink-0" /></>
                )}
              </button>
              {error && (
                <div role="alert" className="mt-4 flex min-w-0 gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
                  <AlertCircle size={18} className="shrink-0" />
                  <p className="min-w-0 break-words">{error}</p>
                </div>
              )}
            </section>
          </div>

          <aside className="min-w-0 space-y-5">
            <section className="rounded-2xl border border-[#cfe1f5] bg-vw-claro p-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-vw">
                <ShieldAlert size={17} className="shrink-0 text-vw-azul" /> Importante
              </h3>
              <p className="mt-2 text-xs leading-6 text-slate-600">
                La IA puede omitir daños o interpretar reflejos como defectos. Valida siempre los hallazgos con una revisión física.
              </p>
            </section>
          </aside>
        </div>

        {resultado && (
          <section className="mt-9 scroll-mt-6" id="resultado">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-vw sm:text-2xl">03. Resultado del análisis</h2>
              <button
                type="button"
                onClick={() => { setResultado(null); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                className="inline-flex min-h-10 items-center gap-2 text-xs font-semibold text-vw-azul hover:text-vw"
              >
                <RotateCcw size={15} /> Volver a analizar
              </button>
            </div>
            <Resultado resultado={resultado} />
          </section>
        )}
      </main>

      {camaraAbierta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#001e50]/85 p-3 sm:p-6">
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Tomar fotografía del vehículo"
            className="flex max-h-[96dvh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
          >
            <div className="flex items-center justify-between gap-3 border-b border-vw-borde px-4 py-3 sm:px-6">
              <div>
                <h2 className="font-semibold text-vw">Cámara del vehículo</h2>
                <p className="text-xs text-slate-500">Fotografías: {archivos.length} / {MAX_IMAGENES}</p>
              </div>
              <button
                type="button"
                onClick={cerrarCamara}
                aria-label="Cerrar cámara"
                className="flex h-11 w-11 items-center justify-center rounded-xl text-vw hover:bg-vw-claro"
              >
                <X size={22} />
              </button>
            </div>

            <div className="min-h-0 overflow-y-auto p-3 sm:p-5">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="h-[48dvh] max-h-[520px] w-full rounded-xl bg-slate-950 object-contain sm:h-[58dvh]"
              />
              {!camaraLista && !errorCamara && (
                <p className="mt-3 flex items-center justify-center gap-2 text-sm text-vw">
                  <LoaderCircle size={18} className="animate-spin" /> Abriendo cámara...
                </p>
              )}
              {errorCamara && (
                <p role="alert" className="mt-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-800">
                  {errorCamara}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-vw-borde p-3 sm:p-5">
              <button
                type="button"
                onClick={cerrarCamara}
                className="min-h-12 rounded-xl border border-vw-borde bg-white px-4 text-sm font-semibold text-vw hover:bg-vw-claro"
              >
                Finalizar
              </button>
              <button
                type="button"
                disabled={!camaraLista || capturando || bloqueado || archivos.length >= MAX_IMAGENES}
                onClick={tomarFoto}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-vw px-4 text-sm font-semibold text-white hover:bg-[#003681] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {capturando ? <LoaderCircle size={18} className="animate-spin" /> : <Camera size={18} />}
                {capturando ? "Guardando..." : "Capturar foto"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
