import { useEffect, useRef, useState } from "react";
import Topbar from "./components/Topbar.jsx";
import Hero from "./components/Hero.jsx";
import SelectorCita from "./components/SelectorCita.jsx";
import CargaEvidencia from "./components/CargaEvidencia.jsx";
import PanelAnalisis from "./components/PanelAnalisis.jsx";
import Resultados from "./components/Resultados.jsx";
import CamaraModal from "./components/CamaraModal.jsx";
import { extraerFotogramas } from "./lib/extraerFotogramas.js";
import { API_BASE } from "./lib/api.js";

const MAX_IMAGENES = 12;
const MAX_VIDEO = 80 * 1024 * 1024;
const MAX_FOTO = 8 * 1024 * 1024;
const formatosImagen = ["image/jpeg", "image/png", "image/webp"];

export default function App() {
  const [archivos, setArchivos] = useState([]);
  const [procesando, setProcesando] = useState(false);
  const [analizando, setAnalizando] = useState(false);
  const [arrastrando, setArrastrando] = useState(false);
  const [error, setError] = useState("");
  const [resultado, setResultado] = useState(null);
  const [fechaAnalisis, setFechaAnalisis] = useState(null);
  const [camaraAbierta, setCamaraAbierta] = useState(false);
  const [camaraLista, setCamaraLista] = useState(false);
  const [capturando, setCapturando] = useState(false);
  const [errorCamara, setErrorCamara] = useState("");
  const [cita, setCita] = useState(null);
  const selectorRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const urlsRef = useRef(new Set());

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
          if (archivo.size > MAX_FOTO) throw new Error(`${archivo.name}: la fotografía supera 8 MB.`);
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

      const url = `${API_BASE}/inspector-ai/api/analizar/`;
      let respuesta;
      try {
        respuesta = await fetch(url, { method: "POST", body: formulario });
      } catch {
        throw new Error(
          `No se pudo conectar con ${url}. El navegador bloqueó la petición: red inaccesible u origen no permitido en CORS (${window.location.origin}).`,
        );
      }

      const datos = await respuesta.json().catch(() => ({}));

      if (!respuesta.ok) {
        throw new Error(
          datos.error ||
            datos.detail ||
            `El servidor respondió HTTP ${respuesta.status}. Comprueba que el backend esté ejecutándose.`,
        );
      }

      setFechaAnalisis(new Date());
      setResultado(datos);
    } catch (e) {
      setError(e.message);
    } finally {
      setAnalizando(false);
    }
  }

  const bloqueado = procesando || analizando;

  return (
    <div className="min-h-screen bg-vw-pagina text-slate-700">
      <div className="min-w-0">
        <Topbar />

        <main>
          <Hero />

          <div className="px-4 pb-6 pt-5 sm:px-6 lg:px-7">
            <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
              <div className="min-w-0 space-y-5">
                <SelectorCita cita={cita} bloqueado={bloqueado} onSeleccion={setCita} />

                <CargaEvidencia
                  archivos={archivos}
                  maxImagenes={MAX_IMAGENES}
                  arrastrando={arrastrando}
                  procesando={procesando}
                  bloqueado={bloqueado}
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
                bloqueado={bloqueado}
                analizando={analizando}
                total={archivos.length}
                maxImagenes={MAX_IMAGENES}
                error={error}
                cita={cita}
                onAnalizar={analizar}
              />
            </div>

            {resultado && (
              <section id="resultado" className="scroll-mt-24">
                <Resultados
                  resultado={resultado}
                  archivos={archivos}
                  fecha={fechaAnalisis}
                  cita={cita}
                  onVolver={() => {
                    setResultado(null);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                />
              </section>
            )}
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
    </div>
  );
}
