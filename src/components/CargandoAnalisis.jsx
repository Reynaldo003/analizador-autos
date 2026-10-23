import { useEffect, useState } from "react";
import { LoaderCircle, ShieldCheck, Sparkles } from "lucide-react";

const MENSAJES = [
  "Estamos revisando cada fotografía con cuidado...",
  "La inteligencia artificial está inspeccionando la carrocería...",
  "Detectando daños, rayones y objetos ajenos...",
  "Comparando los detalles de cada evidencia...",
  "Verificando piezas y zonas del vehículo...",
  "Preparando el reporte visual de la inspección...",
  "Casi terminamos, no cierres esta página...",
];

const RUTA_GIF = "/mario-caminando.gif";

export default function CargandoAnalisis({ progresoIA }) {
  const [indice, setIndice] = useState(0);
  const [gifDisponible, setGifDisponible] = useState(true);

  useEffect(() => {
    const temporizador = setInterval(() => {
      setIndice((actual) => (actual + 1) % MENSAJES.length);
    }, 3200);

    return () => clearInterval(temporizador);
  }, []);

  return (
    <div className="cargando-ia mx-4 mb-4 overflow-hidden rounded-xl border border-vw-borde bg-gradient-to-br from-vw-claro via-white to-vw-claro p-4 sm:mx-5 sm:p-5">
      <div className="flex items-stretch gap-4">
        <div className="relative grid h-14 w-14 shrink-0 self-center place-items-center">
          <span className="cargando-ia-anillo absolute inset-0 rounded-full border-2 border-vw-azul/40" />
          <span className="cargando-ia-anillo cargando-ia-anillo-lento absolute inset-0 rounded-full border-2 border-vw-azul/30" />
          <span className="relative grid h-11 w-11 place-items-center rounded-full bg-vw-azul text-white shadow-lg shadow-vw-azul/30">
            <LoaderCircle size={20} className="animate-spin" />
          </span>
        </div>

        <div className="min-w-0 flex-1 self-center">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-vw-azul">
            <Sparkles size={13} className="shrink-0" />
            <span className="truncate">Inspector IA en proceso</span>
          </div>
          <p
            key={indice}
            className="cargando-ia-texto mt-1 text-[13px] font-semibold leading-snug text-vw"
          >
            {MENSAJES[indice]}
          </p>
          {progresoIA && (
            <p className="mt-1 truncate text-[11px] text-slate-500" title={progresoIA}>
              {progresoIA}
            </p>
          )}
        </div>

        {gifDisponible && (
          <img
            src={RUTA_GIF}
            alt="Mario Bros caminando cargando análisis"
            className="cargando-ia-gif -mb-3 h-20 w-auto shrink-0 self-end object-contain sm:h-24"
            onError={() => setGifDisponible(false)}
          />
        )}
      </div>

      <div className="relative mt-2 h-2 overflow-hidden rounded-full bg-vw-borde/70">
        <span className="cargando-ia-barra absolute inset-y-0 w-1/3 rounded-full bg-gradient-to-r from-vw-azul/40 via-vw-azul to-vw-azul/40" />
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500">
        <ShieldCheck size={13} className="shrink-0 text-emerald-500" />
        Guardamos tus evidencias aunque el análisis tarde un poco más.
      </div>
    </div>
  );
}
