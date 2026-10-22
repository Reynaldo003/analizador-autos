import { AlertCircle, ArrowRight, Clock, LoaderCircle, Zap } from "lucide-react";
import { Tarjeta } from "./Tarjeta.jsx";

export default function PanelAnalisis({
  bloqueado,
  analizando,
  total,
  maxImagenes,
  error,
  cita,
  onAnalizar,
}) {
  return (
    <Tarjeta className="min-w-0">
      <div className="p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-vw-azul text-white">
            <Zap size={20} />
          </span>
          <h2 className="text-base font-semibold text-vw">Iniciar análisis</h2>
        </div>

        <p className="mt-3 text-[13px] leading-relaxed text-slate-500">
          Una vez cargadas las evidencias, la IA analiza automáticamente el vehículo.
        </p>

        <p className="mt-3 text-[11px] font-medium text-slate-400">
          Evidencias listas: {total} / {maxImagenes}
        </p>

        {cita && (
          <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wide text-emerald-700">Cita seleccionada</p>
            <p className="mt-0.5 truncate text-[12px] font-semibold text-emerald-900">
              {cita.unidad || "Vehículo sin modelo"} · {cita.folio}
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={onAnalizar}
          disabled={bloqueado || total === 0}
          className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-vw-btn px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-vw-btn-alt focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vw-azul disabled:bg-slate-200 disabled:text-slate-500 sm:text-[15px]"
        >
          {analizando ? (
            <>
              <LoaderCircle size={18} className="shrink-0 animate-spin" /> Analizando evidencia...
            </>
          ) : (
            <>
              Analizar vehículo <ArrowRight size={18} className="shrink-0" />
            </>
          )}
        </button>

        <div className="mt-4 flex gap-3 rounded-xl border border-[#cfe1f5] bg-vw-claro p-4">
          <Clock size={16} className="mt-0.5 shrink-0 text-vw-azul" />
          <p className="text-[12px] leading-relaxed text-slate-600">
            El análisis puede tardar unos segundos. Puedes agregar más fotos antes de iniciar.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-4 flex min-w-0 gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
          >
            <AlertCircle size={17} className="mt-0.5 shrink-0" />
            <p className="min-w-0 break-words text-[13px] leading-relaxed">{error}</p>
          </div>
        )}
      </div>
    </Tarjeta>
  );
}
