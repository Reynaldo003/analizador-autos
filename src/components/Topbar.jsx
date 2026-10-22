import { Etiqueta } from "./Tarjeta.jsx";

export default function Topbar() {
  return (
    <header className="border-b border-vw-borde bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-7">
        <div className="flex min-w-0 items-center gap-3">
          <div className="shrink-0 rounded-xl border border-vw-borde bg-vw-claro">
            <img src="/vw_dark.png" alt="Logo VW" className="h-14 w-14 object-contain" />
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
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-vw-azul" />
          Análisis asistido por IA
        </Etiqueta>
      </div>
    </header>
  );
}
