import { Sparkles } from "lucide-react";

const FONDO_HERO = "/hero-fondo.jpg";

export default function Hero() {
  return (
    <section
      className="relative isolate overflow-hidden text-white"
      style={{
        backgroundImage: "linear-gradient(100deg, #04122e 0%, #0a2a63 55%, #15529f 100%)",
      }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url("${FONDO_HERO}")` }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-[#04122e] via-[#062a63]/88 to-[#1a5fbf]/55"
      />

      <div className="relative px-5 py-9 sm:px-7 sm:py-11 lg:px-9 lg:py-14">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/60 sm:text-[11px]">
          Inspección visual automotriz
        </p>
        <h1 className="mt-2 max-w-3xl text-[clamp(1.75rem,4vw,2.75rem)] font-bold leading-[1.12] tracking-tight text-white">
          Detecta posibles daños exteriores{" "}
          <span className="text-[#7cc0ff]">desde fotografías o videos.</span>
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/80 sm:text-[15px]">
          Carga las fotos o videos del vehículo y la IA identificará posibles daños, defectos o
          reflejos.
        </p>
      </div>

      <div className="absolute right-6 top-6 hidden items-center gap-3 rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm xl:flex">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/15 text-white">
          <Sparkles size={17} />
        </span>
        <span>
          <span className="block text-[13px] font-semibold leading-tight text-white">
            Tecnología IA
          </span>
          <span className="block text-[11px] leading-tight text-white/70">Análisis en segundos</span>
        </span>
      </div>
    </section>
  );
}
