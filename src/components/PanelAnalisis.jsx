
import { AlertCircle, ArrowRight, CheckCircle2, LoaderCircle, ShieldCheck, Sparkles } from "lucide-react";
import { Tarjeta } from "./Tarjeta.jsx";

export default function PanelAnalisis({ bloqueado, analizando, total, error, cita, progresoIA, onAnalizar }) {
  const listo = Boolean(cita) && total > 0 && !bloqueado;

  return (
    <Tarjeta className="min-w-0 overflow-hidden">
      <div className="border-l-4 border-vw-azul p-4 sm:p-5 lg:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-vw-claro text-vw-azul">
                <Sparkles size={20} />
              </span>
              <div className="min-w-0">
                <h2 className="text-base font-bold text-vw">Analizar evidencias con IA</h2>
                <p className="text-[12px] text-slate-500">Paso siguiente: revisar las fotografías del vehículo</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px]">
              <span className={`rounded-full px-3 py-1 font-semibold ${cita ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                {cita ? <><CheckCircle2 size={13} className="mr-1 inline" />{cita.folio}</> : "Selecciona una cita"}
              </span>
              <span className="rounded-full bg-vw-claro px-3 py-1 font-semibold text-vw">
                {total} fotografía{total === 1 ? "" : "s"} pendiente{total === 1 ? "" : "s"}
              </span>
            </div>
            <p className="mt-2 text-[12px] leading-5 text-slate-500">
              {total > 0
                ? "Se guardarán las fotografías nuevas y se analizarán las que todavía no tengan resultado."
                : "Agrega fotografías o selecciona una cita con evidencias pendientes para comenzar."}
            </p>
          </div>
          <div className="w-full shrink-0 lg:w-72">
            <button
              type="button"
              onClick={onAnalizar}
              disabled={!listo}
              aria-busy={analizando}
              className="flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-vw-btn px-5 py-3 text-[14px] font-bold text-white shadow-sm transition-colors hover:bg-vw-btn-alt focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vw-azul disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none"
            >
              {analizando ? <LoaderCircle size={19} className="animate-spin" /> : <Sparkles size={19} />}
              <span>{analizando ? "Analizando evidencias..." : "Analizar vehículo"}</span>
              {!analizando && <ArrowRight size={18} />}
            </button>
            <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-[11px] text-slate-400">
              <ShieldCheck size={13} /> El resultado se guarda en la cita seleccionada
            </p>
          </div>
        </div>
        {analizando && (
          <div className="mt-4 rounded-xl border border-[#cfe1f5] bg-vw-claro p-3" role="status" aria-live="polite">
            <p className="flex items-start gap-2 text-[12px] font-medium leading-5 text-vw">
              <LoaderCircle size={16} className="mt-0.5 shrink-0 animate-spin" />
              <span className="min-w-0 break-words">{progresoIA || "Preparando análisis..."}</span>
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white">
              <div className="h-full w-1/3 animate-pulse rounded-full bg-vw-azul" />
            </div>
          </div>
        )}
        {error && (
          <div role="alert" className="mt-4 flex gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-[12px] leading-5 text-rose-800">
            <AlertCircle size={17} className="mt-0.5 shrink-0" />
            <p className="min-w-0 break-words">{error}</p>
          </div>
        )}
      </div>
    </Tarjeta>
  );
}
