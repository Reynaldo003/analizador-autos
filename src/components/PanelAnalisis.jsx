import { AlertCircle, ArrowRight, LoaderCircle, RefreshCw, Zap } from "lucide-react";
import { Tarjeta } from "./Tarjeta.jsx";
import CargandoAnalisis from "./CargandoAnalisis.jsx";

export default function PanelAnalisis({
  bloqueado,
  analizando,
  total,
  maxImagenes,
  error,
  cita,
  progresoIA,
  onAnalizar,
  analizados = 0,
}) {
  const puedeForzar = total === 0 && analizados > 0;

  function reanalizar() {
    const confirmado = window.confirm(
      "Se volverán a analizar todas las fotografías de la cita con la IA. ¿Continuar?",
    );
    if (confirmado) onAnalizar(true);
  }

  return (
    <Tarjeta className="min-w-0">
      <div className="flex flex-wrap items-center gap-3 p-4 sm:px-5">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-vw-azul text-white">
          <Zap size={17} />
        </span>

        <div className="min-w-0 flex-1">
          <h2 className="text-[13px] font-semibold leading-tight text-vw sm:text-sm">
            Iniciar análisis
          </h2>
          <p className="mt-0.5 text-[11px] leading-tight text-slate-500">
            {total} / {maxImagenes} evidencias listas
            {cita ? ` · ${cita.folio}` : ""}
          </p>
        </div>

        {puedeForzar && (
          <button
            type="button"
            onClick={reanalizar}
            disabled={bloqueado}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-vw-borde bg-white px-3.5 py-2.5 text-[13px] font-semibold text-vw transition-colors hover:bg-vw-claro disabled:bg-slate-100 disabled:text-slate-400"
          >
            <RefreshCw size={15} className="shrink-0" /> Re-analizar
          </button>
        )}
          <button
            type="button"
            onClick={() => onAnalizar(false)}
            disabled={bloqueado || total === 0}
            className="ml-auto inline-flex min-h-10 w-[530px] max-w-full items-center justify-center gap-2 rounded-xl bg-vw-btn px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-vw-btn/25 transition-all hover:bg-vw-btn-alt disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none"
          >
          {analizando ? (
            <>
              <LoaderCircle size={16} className="shrink-0 animate-spin" /> Analizando…
            </>
          ) : (
            <>
              Analizar vehículo <ArrowRight size={16} className="shrink-0" />
            </>
          )}
        </button>
      </div>

      {analizando ? (
        <CargandoAnalisis progresoIA={progresoIA} />
      ) : (
        progresoIA && (
          <p className="mx-4 mb-4 flex items-center gap-2 rounded-lg bg-vw-claro px-3 py-2 text-[11.5px] font-medium text-vw sm:mx-5">
            <LoaderCircle size={13} className="shrink-0 animate-spin text-vw-azul" />
            {progresoIA}
          </p>
        )
      )}

      {error && (
        <div
          role="alert"
          className="mx-4 mb-4 flex min-w-0 gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 sm:mx-5"
        >
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <p className="min-w-0 break-words text-[12.5px] leading-relaxed">{error}</p>
        </div>
      )}
    </Tarjeta>
  );
}