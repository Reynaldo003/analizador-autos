export function Tarjeta({ children, className = "" }) {
  return (
    <section className={`rounded-2xl border border-vw-borde bg-white shadow-sm ${className}`}>
      {children}
    </section>
  );
}

export function CabeceraTarjeta({ icono: Icono, titulo, descripcion, derecha }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5 sm:px-6 sm:pt-6">
      <div className="flex min-w-0 items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-vw-claro text-vw-azul">
          <Icono size={19} />
        </span>
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold leading-tight text-vw sm:text-base">{titulo}</h2>
          {descripcion && (
            <p className="mt-1 text-xs leading-relaxed text-slate-500 sm:text-[13px]">{descripcion}</p>
          )}
        </div>
      </div>
      {derecha}
    </div>
  );
}

export function Etiqueta({ children, color = "border-vw-borde bg-vw-claro text-vw" }) {
  return (
    <span
      className={`inline-flex max-w-full items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold ${color}`}
    >
      {children}
    </span>
  );
}

export function Seccion({ titulo, elementos, icono: Icono }) {
  if (!elementos?.length) return null;

  return (
    <section className="min-w-0 rounded-xl border border-vw-borde bg-white p-4">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-vw">
        <Icono size={16} className="shrink-0 text-vw-azul" />
        {titulo}
      </h3>
      <ul className="space-y-2.5 text-[13px] leading-relaxed text-slate-600">
        {elementos.map((texto, indice) => (
          <li key={indice} className="flex min-w-0 gap-2.5">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-vw-azul" />
            <span className="min-w-0 break-words">{texto}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
