import { useEffect } from "react";
import { Download, Film, Image as ImageIcon, X } from "lucide-react";

export default function Visor({ src, tipo = "imagen", nombre = "", descarga, onCerrar }) {
  useEffect(() => {
    function alEscape(evento) {
      if (evento.key === "Escape") onCerrar();
    }
    window.addEventListener("keydown", alEscape);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", alEscape);
      document.body.style.overflow = "";
    };
  }, [onCerrar]);

  if (!src) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#04122e]/80 p-3 backdrop-blur-sm sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label={nombre || "Vista previa de evidencia"}
      onClick={onCerrar}
    >
      <div
        className="flex max-h-full w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(evento) => evento.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-vw-borde px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-vw-claro text-vw-azul">
              {tipo === "video" ? <Film size={16} /> : <ImageIcon size={16} />}
            </span>
            <p className="truncate text-[13px] font-semibold text-vw">{nombre || "Evidencia"}</p>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {descarga && (
              <a
                href={descarga}
                download
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-vw-btn px-3 py-2 text-[11px] font-semibold text-white transition-colors hover:bg-vw-btn-alt"
              >
                <Download size={13} /> Descargar
              </a>
            )}
            <button
              type="button"
              onClick={onCerrar}
              aria-label="Cerrar vista previa"
              className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-vw-claro hover:text-vw"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 items-center justify-center bg-[#0b1526] p-2 sm:p-3">
          {tipo === "video" ? (
            <video src={src} controls autoPlay className="max-h-[74vh] w-full max-w-full" />
          ) : (
            <img
              src={src}
              alt={nombre}
              className="max-h-[74vh] w-auto max-w-full object-contain"
            />
          )}
        </div>
      </div>
    </div>
  );
}
