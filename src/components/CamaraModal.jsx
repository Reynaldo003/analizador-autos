import { Camera, LoaderCircle, X } from "lucide-react";

export default function CamaraModal({
  lista,
  capturando,
  error,
  total,
  maxImagenes,
  bloqueado,
  videoRef,
  onCerrar,
  onCapturar,
}) {
  return (
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
            <p className="text-xs text-slate-500">
              Fotografías: {total} / {maxImagenes}
            </p>
          </div>
          <button
            type="button"
            onClick={onCerrar}
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
          {!lista && !error && (
            <p className="mt-3 flex items-center justify-center gap-2 text-sm text-vw">
              <LoaderCircle size={18} className="animate-spin" /> Abriendo cámara...
            </p>
          )}
          {error && (
            <p role="alert" className="mt-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-800">
              {error}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-vw-borde p-3 sm:p-5">
          <button
            type="button"
            onClick={onCerrar}
            className="min-h-12 rounded-xl border border-vw-borde bg-white px-4 text-sm font-semibold text-vw hover:bg-vw-claro"
          >
            Finalizar
          </button>
          <button
            type="button"
            disabled={!lista || capturando || bloqueado || total >= maxImagenes}
            onClick={onCapturar}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-vw-btn px-4 text-sm font-semibold text-white hover:bg-vw-btn-alt disabled:cursor-not-allowed disabled:opacity-50"
          >
            {capturando ? <LoaderCircle size={18} className="animate-spin" /> : <Camera size={18} />}
            {capturando ? "Guardando..." : "Capturar foto"}
          </button>
        </div>
      </section>
    </div>
  );
}
