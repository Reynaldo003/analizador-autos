//src/App.jsx
import { useEffect, useRef, useState } from "react";
import { Play, X } from "lucide-react";
import Topbar from "./components/Topbar.jsx";
import Hero from "./components/Hero.jsx";
import SelectorCita from "./components/SelectorCita.jsx";
import CargaEvidencia from "./components/CargaEvidencia.jsx";
import PanelAnalisis from "./components/PanelAnalisis.jsx";
import Resultados from "./components/Resultados.jsx";
import CamaraModal from "./components/CamaraModal.jsx";
import Visor from "./components/Visor.jsx";
import { extraerFotogramas } from "./lib/extraerFotogramas.js";
import { API_BASE } from "./lib/api.js";
const MAX_IMAGENES = 12;
const MAX_VIDEO = 80 * 1024 * 1024;
const MAX_FOTO = 10 * 1024 * 1024;
const formatosImagen = ["image/jpeg", "image/png", "image/webp"];
function obtenerTokenCRM() {
  let auth = {};
  try {
    auth = JSON.parse(localStorage.getItem("auth") || "{}") || {};
  } catch {
    auth = {};
  }
  const candidatos = [
    auth.access,
    auth.access_token,
    auth.token,
    auth.tokens?.access,
    localStorage.getItem("auth.access"),
    localStorage.getItem("access"),
    localStorage.getItem("accessToken"),
    localStorage.getItem("@token_access_jwt"),
    localStorage.getItem("token"),
  ];
  return candidatos.find((valor) => typeof valor === "string" && valor.trim()) || "";
}
async function peticionCRM(ruta, opciones = {}) {
  const { publico = false, headers = {}, ...configuracion } = opciones;
  const token = publico ? "" : obtenerTokenCRM();
  async function enviar(conToken) {
    const respuesta = await fetch(`${API_BASE}${ruta}`, {
      ...configuracion,
      headers: {
        ...(conToken ? { Authorization: `Bearer ${conToken}` } : {}),
        ...headers,
      },
    });
    const datos = await respuesta.json().catch(() => null);
    return { respuesta, datos };
  }
  let { respuesta, datos } = await enviar(token);
  if (token && (respuesta.status === 401 || respuesta.status === 403)) {
    ({ respuesta, datos } = await enviar(""));
  }
  if (!respuesta.ok) {
    throw new Error(
      datos?.detail ||
      datos?.error ||
      (Array.isArray(datos?.non_field_errors) ? datos.non_field_errors.join(" ") : "") ||
      `El servidor respondió HTTP ${respuesta.status}.`
    );
  }
  return datos;
}
function esFotografia(evidencia) {
  const nombre = evidencia.nombre_original || "";
  return evidencia.tipo_mime?.startsWith("image/") ||
    /\.(jpg|jpeg|png|webp)$/i.test(nombre);
}
export default function App() {
  const [archivos, setArchivos] = useState([]);
  const [procesando, setProcesando] = useState(false);
  const [analizando, setAnalizando] = useState(false);
  const [arrastrando, setArrastrando] = useState(false);
  const [error, setError] = useState("");
  const [resultado, setResultado] = useState(null);
  const [camaraAbierta, setCamaraAbierta] = useState(false);
  const [camaraLista, setCamaraLista] = useState(false);
  const [capturando, setCapturando] = useState(false);
  const [errorCamara, setErrorCamara] = useState("");
  const [cita, setCita] = useState(null);
  const [evidenciasGuardadas, setEvidenciasGuardadas] = useState([]);
  const [analisisGuardados, setAnalisisGuardados] = useState([]);
  const [cargandoCita, setCargandoCita] = useState(false);
  const [progresoIA, setProgresoIA] = useState("");
  const [visor, setVisor] = useState(null);
  const selectorRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const urlsRef = useRef(new Set());
useEffect(() => {
  if (!cita) return;

  const scrollY = window.scrollY;
  const body = document.body;

  const estilosOriginales = {
    position: body.style.position,
    top: body.style.top,
    left: body.style.left,
    right: body.style.right,
    width: body.style.width,
    overflow: body.style.overflow,
  };

  body.style.position = "fixed";
  body.style.top = `-${scrollY}px`;
  body.style.left = "0";
  body.style.right = "0";
  body.style.width = "100%";
  body.style.overflow = "hidden";

  return () => {
    Object.assign(body.style, estilosOriginales);
    window.scrollTo(0, scrollY);
  };
}, [Boolean(cita)]);

  useEffect(() => {
    if (!cita?.id) {
      setEvidenciasGuardadas([]);
      setAnalisisGuardados([]);
      return;
    }
    const control = new AbortController();
    async function cargarDetalleCita() {
      setCargandoCita(true);
      setError("");
      setEvidenciasGuardadas([]);
      setAnalisisGuardados([]);
      try {
        const agencia = encodeURIComponent(cita.agencia || "");
        const detalle = await peticionCRM(
          `/hojaingresos/api/hoja-ingresos/${cita.id}/?agencia=${agencia}`,
          { signal: control.signal }
        );
        if (control.signal.aborted) return;
        setEvidenciasGuardadas(
          Array.isArray(detalle.evidencias) ? detalle.evidencias : []
        );
        setAnalisisGuardados(
          Array.isArray(detalle.analisis_ia) ? detalle.analisis_ia : []
        );
      } catch (error) {
        if (!control.signal.aborted) {
          console.error("Error cargando las evidencias:", error);
          setError(`No se pudieron cargar las evidencias de la cita: ${error.message}`);
        }
      } finally {
        if (!control.signal.aborted) setCargandoCita(false);
      }
    }
    cargarDetalleCita();
    return () => control.abort();
  }, [cita?.id, cita?.agencia]);
  function seleccionarCita(nuevaCita) {
    if (procesando || analizando || cargandoCita) return;
    if (cita?.id === nuevaCita?.id) return;
    limpiar();
    setCita(nuevaCita);
    setEvidenciasGuardadas([]);
    setAnalisisGuardados([]);
    setProgresoIA("");
  }
  useEffect(
    () => () => {
      for (const url of urlsRef.current) URL.revokeObjectURL(url);
      urlsRef.current.clear();
    },
    [],
  );
  useEffect(() => {
    if (!resultado) return;
    const temporizador = setTimeout(() => {
      document.getElementById("resultado")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
    return () => clearTimeout(temporizador);
  }, [resultado]);
  useEffect(() => {
    if (!camaraAbierta) return;
    let activo = true;
    const video = videoRef.current;
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
        if (video) {
          video.srcObject = flujo;
          await video.play();
        }
        if (activo) setCamaraLista(true);
      } catch (e) {
        if (activo) {
          setErrorCamara(
            e.name === "NotAllowedError"
              ? "Permite el acceso a la cámara en tu navegador para tomar fotografías."
              : "No se pudo abrir la cámara. Comprueba sus permisos o utiliza Seleccionar archivos.",
          );
        }
      }
    }
    iniciarCamara();
    return () => {
      activo = false;
      streamRef.current?.getTracks().forEach((pista) => pista.stop());
      streamRef.current = null;
      if (video) video.srcObject = null;
    };
  }, [camaraAbierta]);

  function cerrarExpediente() {
    if (procesando || analizando || cargandoCita) return;

    if (
      archivos.length > 0 &&
      !window.confirm(
        "Tienes archivos sin guardar. ¿Deseas cerrar el expediente?"
      )
    ) {
      return;
    }

    seleccionarCita(null);
  }

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
    if (!camaraLista || !video?.videoWidth || capturando || procesando || archivos.length >= MAX_IMAGENES)
      return;
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
        if (espacios <= 0)
          throw new Error("Se alcanzó el máximo de 12 imágenes; no se añadieron los archivos restantes.");
        if (formatosImagen.includes(archivo.type)) {
          if (archivo.size > MAX_FOTO) throw new Error(`${archivo.name}: la fotografía supera 10 MB.`);
          nuevos.push({
            id: crypto.randomUUID(),
            archivo,
            nombre: archivo.name,
            origen: "Fotografía",
            vista: generarVista(archivo),
          });
          espacios--;
        } else if (archivo.type.startsWith("video/")) {
          if (archivo.size > MAX_VIDEO) throw new Error(`${archivo.name}: el video supera 80 MB.`);
          const capturas = await extraerFotogramas(archivo, Math.min(6, espacios));
          for (const captura of capturas) {
            nuevos.push({ ...captura, id: crypto.randomUUID(), vista: generarVista(captura.archivo) });
            espacios--;
          }
        } else {
          throw new Error(
            `${archivo.name}: formato no compatible. Usa JPG, PNG, WEBP o un video que pueda reproducir tu navegador.`,
          );
        }
      }
    } catch (e) {
      setError(e.message);
    } finally {
      if (nuevos.length) setArchivos((actuales) => [...actuales, ...nuevos]);
      setProcesando(false);
      setArrastrando(false);
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
  async function analizar(forzar = false) {
    if (!cita?.id || procesando || analizando || cargandoCita) return;
    const analizadas = new Set(
      analisisGuardados.map((item) => String(item.evidencia_id))
    );
    const anterioresPendientes = evidenciasGuardadas.filter(
      (evidencia) =>
        esFotografia(evidencia) &&
        (forzar || !analizadas.has(String(evidencia.id)))
    );
    if (archivos.length === 0 && anterioresPendientes.length === 0) {
      setError("No hay fotografías pendientes de analizar en esta cita.");
      return;
    }
    setAnalizando(true);
    setResultado(null);
    setError("");
    try {
      let pendientes = [...anterioresPendientes];
      // PASO 1: Guardar las fotografías nuevas como evidencias de la cita.
      if (archivos.length > 0) {
        setProgresoIA(`Guardando ${archivos.length} fotografías en la cita...`);
        const formulario = new FormData();
        archivos.forEach((item) => {
          formulario.append("archivos", item.archivo, item.archivo.name);
        });
        const nuevasEvidencias = await peticionCRM(
          `/hojaingresos/api/hoja-ingresos/${cita.id}/evidencias/`,
          {
            publico: true,
            method: "POST",
            body: formulario,
          }
        );
        if (!Array.isArray(nuevasEvidencias)) {
          throw new Error("El servidor no devolvió las evidencias guardadas.");
        }
        // Quedan guardadas incluso si falla el análisis posterior.
        setEvidenciasGuardadas((anteriores) => [
          ...anteriores,
          ...nuevasEvidencias,
        ]);
        pendientes = [
          ...pendientes,
          ...nuevasEvidencias.filter(esFotografia),
        ];
        // Los archivos locales ya están en Django; evitamos subirlos dos veces.
        limpiar();
      }
      // PASO 2: Ejecutar el análisis sobre cada fotografía sin analizar.
      for (let i = 0; i < pendientes.length; i++) {
        const evidencia = pendientes[i];
        setProgresoIA(
          `Analizando fotografía ${i + 1} de ${pendientes.length}: ${evidencia.nombre_original || "Evidencia"}`
        );
        const analisis = await peticionCRM(
          `/hojaingresos/api/hoja-ingresos/${cita.id}/analizar-ia/`,
          {
            publico: true,
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ evidencia_id: evidencia.id, forzar }),
          }
        );
        // PASO 3: Agregar el resultado a los análisis de la cita.
        setAnalisisGuardados((anteriores) => [
          analisis,
          ...anteriores.filter(
            (item) => String(item.evidencia_id) !== String(analisis.evidencia_id)
          ),
        ]);
      }
      setResultado({ completado: true });
    } catch (error) {
      console.error("Error en Inspector IA:", error);
      setError(error.message || "No se pudo completar el análisis.");
    } finally {
      setAnalizando(false);
      setProgresoIA("");
    }
  }
  const bloqueado = procesando || analizando;
  const idsAnalizados = new Set(
    analisisGuardados.map((item) => String(item.evidencia_id))
  );
  const evidenciasPendientes = evidenciasGuardadas.filter(
    (evidencia) =>
      esFotografia(evidencia) &&
      !idsAnalizados.has(String(evidencia.id))
  );
  const totalPorAnalizar = archivos.length + evidenciasPendientes.length;
  function abrirEvidencia(evidencia) {
    const esVideo =
      evidencia.tipo_mime?.startsWith("video/") ||
      /\.(mp4|mov|webm|m4v)$/i.test(evidencia.nombre_original || "");
    setVisor({
      src: evidencia.url,
      tipo: esVideo ? "video" : "imagen",
      nombre: evidencia.nombre_original || "Evidencia",
    });
  }
  return (
    <div className="min-h-screen bg-vw-pagina text-slate-700">
      <div className="min-w-0">
        <Topbar />
        <main>
          <Hero />
          <div className="mx-auto w-full max-w-[1700px] px-3 pb-7 pt-4 sm:px-5 lg:px-7">
            <div className="space-y-4">
              <div className="min-w-0 space-y-4">
                <SelectorCita
                  cita={null}
                  bloqueado={bloqueado || cargandoCita}
                  onSeleccion={seleccionarCita}
                />
                {cita && (
                  <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-3">
                    <div
                      role="dialog"
                      aria-modal="true"
                      aria-label="Expediente de inspección"
                      className="flex max-h-[94vh] w-full max-w-[1500px] flex-col overflow-hidden rounded-2xl bg-vw-pagina shadow-2xl"
                    >
                      <div className="flex shrink-0 items-center justify-between border-b border-vw-borde bg-white px-5 py-4">
                        <h2 className="text-[15px] font-bold text-vw">
                          {cita.cliente || "Expediente de inspección"}
                        </h2>

                        <button
                          type="button"
                          onClick={cerrarExpediente}
                          disabled={bloqueado || cargandoCita}
                          aria-label="Cerrar expediente"
                          className="grid h-9 w-9 place-items-center rounded-lg text-vw hover:bg-vw-claro disabled:opacity-50"
                        >
                          <X size={20} />
                        </button>
                      </div>
                      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-4">
                      <SelectorCita
                        cita={cita}
                        bloqueado={bloqueado || cargandoCita}
                        onSeleccion={cerrarExpediente}
                      />
                    <div id="carga" className="min-w-0 scroll-mt-24">
                      <CargaEvidencia
                        archivos={archivos}
                        maxImagenes={MAX_IMAGENES}
                        arrastrando={arrastrando}
                        procesando={procesando}
                        bloqueado={bloqueado || cargandoCita}
                        cita={cita}
                        inputRef={selectorRef}
                        onNuevos={agregarArchivos}
                        onArrastrando={setArrastrando}
                        onCamara={abrirCamara}
                        onEliminar={eliminarArchivo}
                        onLimpiar={limpiar}
                      />
                    </div>
                    <PanelAnalisis
                      bloqueado={bloqueado || cargandoCita || !cita}
                      analizando={analizando}
                      total={totalPorAnalizar}
                      maxImagenes={MAX_IMAGENES}
                      analizados={analisisGuardados.length}
                      error={error}
                      cita={cita}
                      onAnalizar={analizar}
                      progresoIA={progresoIA}
                    />
                    <section className="rounded-2xl border border-vw-borde bg-white p-4 sm:p-5">
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <h3 className="text-[14px] font-bold text-vw">
                            Evidencias guardadas de la cita
                          </h3>
                          <p className="mt-1 text-[12px] text-slate-500">
                            Archivos almacenados en el CRM
                          </p>
                        </div>
                        <span className="rounded-lg bg-vw-claro px-3 py-1 text-[11px] font-bold text-vw">
                          {evidenciasGuardadas.length} archivos
                        </span>
                      </div>
                      {cargandoCita ? (
                        <p className="text-[12px] text-slate-500">
                          Cargando evidencias...
                        </p>
                      ) : evidenciasGuardadas.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-vw-borde p-6 text-center text-[12px] text-slate-500">
                          Esta cita todavía no tiene evidencias guardadas.
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-2 min-[420px]:grid-cols-4 md:grid-cols-6 xl:grid-cols-8">
                          {evidenciasGuardadas.map((evidencia) => {
                            const esImagen = esFotografia(evidencia);
                            const esVideo =
                              evidencia.tipo_mime?.startsWith("video/") ||
                              /\.(mp4|mov|webm|m4v)$/i.test(evidencia.nombre_original || "");
                            const procesada = idsAnalizados.has(String(evidencia.id));
                            return (
                              <div
                                key={evidencia.id}
                                className="overflow-hidden rounded-lg border border-vw-borde bg-white"
                              >
                                <div className="flex aspect-square items-center justify-center bg-slate-100">
                                  {esImagen || esVideo ? (
                                    <button
                                      type="button"
                                      onClick={() => abrirEvidencia(evidencia)}
                                      aria-label={`Ver ${evidencia.nombre_original || "evidencia"}`}
                                      className="h-full w-full"
                                    >
                                      {esImagen ? (
                                        <img
                                          src={evidencia.url}
                                          alt={evidencia.nombre_original || "Fotografía"}
                                          className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                                          loading="lazy"
                                        />
                                      ) : (
                                        <span className="relative flex h-full w-full items-center justify-center bg-slate-900">
                                          <video
                                            src={evidencia.url}
                                            preload="metadata"
                                            muted
                                            className="h-full w-full object-contain opacity-80"
                                          />
                                          <span className="absolute grid h-11 w-11 place-items-center rounded-full bg-vw-btn/85 text-white shadow-lg">
                                            <Play size={18} fill="currentColor" />
                                          </span>
                                        </span>
                                      )}
                                    </button>
                                  ) : (
                                    <a
                                      href={evidencia.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[12px] font-semibold text-vw"
                                    >
                                      Ver archivo
                                    </a>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 px-2 py-1.5">
                                  <span
                                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${!esImagen
                                      ? "bg-slate-300"
                                      : procesada
                                        ? "bg-emerald-500"
                                        : "bg-amber-500"
                                      }`}
                                    title={
                                      !esImagen
                                        ? esVideo
                                          ? "Video"
                                          : "Documento"
                                        : procesada
                                          ? "Analizada"
                                          : "Pendiente de IA"
                                    }
                                  />
                                  <p
                                    className="min-w-0 truncate text-[10px] font-medium text-slate-600"
                                    title={evidencia.nombre_original}
                                  >
                                    {evidencia.nombre_original || "Evidencia"}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                    </section>
                    {analisisGuardados.length > 0 && (
              <section id="resultado" className="scroll-mt-24">
                <Resultados
                  analisisGuardados={analisisGuardados}
                  evidenciasGuardadas={evidenciasGuardadas}
                  cita={cita}
                  onVolver={() =>
                    document.getElementById("carga")?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    })
                  }
                  onVerImagen={(src, nombre) =>
                    setVisor({ src, tipo: "imagen", nombre, descarga: src })
                  }
                />
              </section>
                    )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>

        <input
          ref={selectorRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,video/*"
          multiple
          className="hidden"
          onChange={(e) => agregarArchivos(Array.from(e.target.files || []))}
          aria-label="Seleccionar fotografías y videos"
        />
      </div>
      {camaraAbierta && (
        <CamaraModal
          lista={camaraLista}
          capturando={capturando}
          error={errorCamara}
          total={archivos.length}
          maxImagenes={MAX_IMAGENES}
          bloqueado={bloqueado}
          videoRef={videoRef}
          onCerrar={cerrarCamara}
          onCapturar={tomarFoto}
        />
      )}
      {visor && (
        <Visor
          src={visor.src}
          tipo={visor.tipo}
          nombre={visor.nombre}
          descarga={visor.descarga}
          onCerrar={() => setVisor(null)}
        />
      )}
    </div>
  );
}
