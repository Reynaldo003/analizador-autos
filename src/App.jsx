import { useEffect, useRef, useState } from "react";
import {
  AlertCircle, ArrowRight, Camera, CheckCircle2, CircleHelp, ClipboardCheck,
  Film, ImagePlus, LoaderCircle, RotateCcw, SearchCheck, ShieldAlert,
  Sparkles, UploadCloud, X,
} from "lucide-react";
import { extraerFotogramas } from "./lib/extraerFotogramas.js";

const MAX_IMAGENES = 12;
const MAX_VIDEO = 80 * 1024 * 1024;
const MAX_FOTO = 8 * 1024 * 1024;
const formatosImagen = ["image/jpeg", "image/png", "image/webp"];
const estilosEstado = {
  "Sin daños visibles": "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  "Posibles daños": "border-amber-500/30 bg-amber-500/10 text-amber-300",
  "Daños visibles": "border-rose-500/30 bg-rose-500/10 text-rose-300",
  "No concluyente": "border-slate-500/30 bg-slate-500/10 text-slate-300",
};

function Etiqueta({ children, color = "border-slate-700 bg-slate-800/70 text-slate-300" }) {
  return <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${color}`}>{children}</span>;
}

function Seccion({ titulo, elementos, icono: Icono }) {
  if (!elementos?.length) return null;
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/80 p-5 sm:p-6">
      <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-white"><Icono size={18} className="text-cyan-400" />{titulo}</h3>
      <ul className="space-y-3 text-sm leading-relaxed text-slate-300">
        {elementos.map((texto, indice) => <li key={indice} className="flex gap-3"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" />{texto}</li>)}
      </ul>
    </section>
  );
}

function Resultado({ resultado }) {
  return (
    <div className="space-y-5" aria-live="polite">
      <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 via-slate-900 to-slate-900 p-5 sm:p-7">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Etiqueta color={estilosEstado[resultado.estado_general] || estilosEstado["No concluyente"]}>{resultado.estado_general}</Etiqueta>
          <Etiqueta>Atención: {resultado.nivel_atencion}</Etiqueta>
          <Etiqueta>{resultado.total_imagenes} imágenes analizadas</Etiqueta>
        </div>
        <h2 className="mb-2 text-xl font-bold text-white">Resumen de la inspección</h2>
        <p className="leading-relaxed text-slate-300">{resultado.resumen_general}</p>
      </div>

      <section className="rounded-2xl border border-white/10 bg-slate-900/80 p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 font-semibold text-white"><SearchCheck size={19} className="text-cyan-400" />Hallazgos visuales</h3>
          <Etiqueta>{resultado.danos.length} hallazgo(s)</Etiqueta>
        </div>
        {resultado.danos.length === 0 ? (
          <p className="rounded-xl bg-slate-800/50 p-4 text-sm text-slate-300">No se identificaron daños suficientemente claros en las imágenes proporcionadas. Esto no descarta daños en zonas no visibles.</p>
        ) : (
          <div className="space-y-3">
            {resultado.danos.map((dano, indice) => (
              <div key={indice} className="rounded-xl border border-slate-700/70 bg-slate-950/40 p-4">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <h4 className="font-semibold text-slate-100">{dano.pieza} · {dano.tipo}</h4>
                  <Etiqueta color="border-amber-500/25 bg-amber-500/10 text-amber-200">{dano.severidad}</Etiqueta>
                </div>
                <p className="text-sm leading-relaxed text-slate-300">{dano.descripcion}</p>
                <p className="mt-2 text-xs text-slate-500">Evidencia: {dano.evidencia}</p>
              </div>
            ))}
          </div>
        )}
      </section>
      <div className="grid gap-5 lg:grid-cols-2">
        <Seccion titulo="Recomendaciones" elementos={resultado.recomendaciones} icono={ClipboardCheck} />
        <Seccion titulo="Limitaciones del análisis" elementos={resultado.limitaciones} icono={CircleHelp} />
      </div>
      <Seccion titulo="Zonas no evaluadas" elementos={resultado.zonas_no_evaluadas} icono={ShieldAlert} />
      <p className="text-xs leading-relaxed text-slate-500">Evaluación preliminar basada exclusivamente en imágenes. No sustituye una inspección física, peritaje ni diagnóstico de seguridad.</p>
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
  const urlsRef = useRef(new Set());

  useEffect(() => () => {
    for (const url of urlsRef.current) URL.revokeObjectURL(url);
    urlsRef.current.clear();
  }, []);

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
      const respuesta = await fetch("/api/analizar", { method: "POST", body: formulario });
      const datos = await respuesta.json().catch(() => ({}));
      if (!respuesta.ok) throw new Error(datos.error || "No se pudo analizar el vehículo. Comprueba que el servidor esté ejecutándose.");
      setResultado(datos);
    } catch (e) {
      setError(e.message);
    } finally {
      setAnalizando(false);
    }
  }

  const bloqueado = procesando || analizando;

  return (
    <div className="min-h-screen bg-[#080e19] text-slate-200">
      <header className="border-b border-white/10 bg-slate-950/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 p-2.5 text-cyan-400"><Camera size={23} /></div>
            <div><p className="text-base font-bold tracking-tight text-white">AutoInspect <span className="text-cyan-400">AI</span></p><p className="text-[11px] tracking-wide text-slate-500">INSPECCIÓN VISUAL EXTERIOR</p></div>
          </div>
          <Etiqueta color="border-emerald-500/25 bg-emerald-500/5 text-emerald-300"><span className="mr-2 h-1.5 w-1.5 rounded-full bg-emerald-400" />Análisis asistido por IA</Etiqueta>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 pb-16 pt-10 sm:px-8">
        <div className="mb-9 max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-5xl">Detecta posibles daños exteriores <span className="text-cyan-400">desde fotografías o videos.</span></h1>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <section className="rounded-2xl border border-white/10 bg-slate-900/65 p-5 sm:p-7">
              <div className="mb-5 flex items-center justify-between gap-2"><h2 className="text-lg font-semibold text-white">01. Cargar evidencia visual</h2><Etiqueta>{archivos.length} / {MAX_IMAGENES}</Etiqueta></div>
              <input ref={selectorRef} type="file" accept="image/jpeg,image/png,image/webp,video/*" multiple className="hidden" onChange={(e) => agregarArchivos(Array.from(e.target.files || []))} />
              <div
                onDragOver={(e) => { e.preventDefault(); if (!bloqueado) setArrastrando(true); }}
                onDragLeave={(e) => { e.preventDefault(); setArrastrando(false); }}
                onDrop={(e) => { e.preventDefault(); setArrastrando(false); if (!bloqueado) agregarArchivos(Array.from(e.dataTransfer.files)); }}
                className={`rounded-2xl border-2 border-dashed p-9 text-center transition sm:p-12 ${arrastrando ? "border-cyan-400 bg-cyan-400/10" : "border-slate-700 bg-slate-950/45"}`}
              >
                <div className="mx-auto mb-5 w-fit rounded-2xl bg-cyan-400/10 p-4 text-cyan-400"><UploadCloud size={33} /></div>
                <p className="font-semibold text-white">Arrastra las imágenes o videos aquí</p>
                <p className="mt-2 text-sm text-slate-500">JPG, PNG, WEBP, MP4 o videos compatibles con tu navegador</p>
                <button disabled={bloqueado} onClick={() => selectorRef.current?.click()} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-50"><ImagePlus size={17} /> Seleccionar archivos</button>
                <p className="mt-4 text-xs text-slate-500">Máximo 12 imágenes/capturas · 8 MB por foto · 80 MB por video</p>
              </div>
              {procesando && <p className="mt-4 flex items-center gap-2 text-sm text-cyan-300"><LoaderCircle size={17} className="animate-spin" /> Extrayendo fotogramas del video...</p>}

              {archivos.length > 0 && (
                <div className="mt-7">
                  <div className="mb-4 flex items-center justify-between"><h3 className="text-sm font-semibold text-slate-200">Evidencia preparada para el análisis</h3><button disabled={bloqueado} className="text-xs text-slate-400 hover:text-rose-300 disabled:opacity-50" onClick={limpiar}>Eliminar todo</button></div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {archivos.map((archivo, indice) => (
                      <div key={archivo.id} className="group relative overflow-hidden rounded-xl border border-slate-700 bg-slate-950">
                        <img src={archivo.vista} alt={`Evidencia ${indice + 1}`} className="aspect-[4/3] w-full object-cover" />
                        <div className="absolute left-2 top-2 rounded-lg bg-slate-950/85 px-2 py-1 text-[10px] font-medium text-white">#{indice + 1} · {archivo.origen === "Video" ? "Video" : "Foto"}</div>
                        <button disabled={bloqueado} onClick={() => eliminarArchivo(archivo.id)} title="Eliminar imagen" className="absolute right-2 top-2 rounded-lg bg-slate-950/85 p-1.5 text-white hover:bg-rose-600 disabled:opacity-50"><X size={14} /></button>
                        <p title={archivo.nombre} className="truncate px-3 py-2 text-xs text-slate-400">{archivo.nombre}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-white/10 bg-slate-900/65 p-5 sm:p-7">
              <div className="mb-4 flex items-center justify-between gap-3"><h2 className="text-lg font-semibold text-white">02. Ejecutar inspección</h2><SearchCheck size={22} className="text-cyan-400" /></div>
              <p className="mb-5 text-sm leading-relaxed text-slate-400">Las fotografías seleccionadas y los fotogramas de los videos se analizarán juntos para generar un reporte visual estructurado.</p>
              <button disabled={bloqueado || archivos.length === 0} onClick={analizar} className="flex w-full items-center justify-center gap-3 rounded-xl bg-cyan-400 px-5 py-3.5 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:bg-slate-700 disabled:text-slate-400">
                {analizando ? <><LoaderCircle size={19} className="animate-spin" /> Analizando evidencia...</> : <><Sparkles size={19} /> Analizar vehículo <ArrowRight size={19} /></>}
              </button>
              {error && <div role="alert" className="mt-4 flex gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200"><AlertCircle size={18} className="shrink-0" />{error}</div>}
            </section>
          </div>

          <aside className="space-y-5">
            <section className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5"><h3 className="flex items-center gap-2 text-sm font-semibold text-amber-200"><ShieldAlert size={17} />Importante</h3><p className="mt-2 text-xs leading-6 text-slate-400">La IA puede omitir daños o interpretar reflejos como defectos. Valida siempre los hallazgos con una revisión física.</p></section>
          </aside>
        </div>

        {resultado && <section className="mt-9" id="resultado"><div className="mb-5 flex items-center justify-between gap-3"><h2 className="text-2xl font-bold text-white">03. Resultado del análisis</h2><button onClick={() => { setResultado(null); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="flex items-center gap-2 text-xs text-cyan-300 hover:text-cyan-200"><RotateCcw size={15} /> Volver a analizar</button></div><Resultado resultado={resultado} /></section>}
      </main>
    </div>
  );
}
