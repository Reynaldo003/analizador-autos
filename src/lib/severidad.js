//src/lib/severidad.js
const TONOS = {
  grave: {
    peso: 0,
    badge: "border-rose-200 bg-rose-50 text-rose-700",
    burbuja: "bg-rose-500",
    titulo: "Daños graves",
    icono: "text-rose-500",
    ficha: "border-rose-100 bg-rose-50",
    cifra: "text-rose-600",
  },
  moderado: {
    peso: 1,
    badge: "border-amber-200 bg-amber-50 text-amber-700",
    burbuja: "bg-amber-500",
    titulo: "Daño moderado",
    icono: "text-amber-500",
    ficha: "border-amber-100 bg-amber-50",
    cifra: "text-amber-600",
  },
  leve: {
    peso: 2,
    badge: "border-sky-200 bg-sky-50 text-sky-700",
    burbuja: "bg-sky-500",
    titulo: "Observaciones",
    icono: "text-sky-500",
    ficha: "border-sky-100 bg-sky-50",
    cifra: "text-sky-600",
  },
  neutro: {
    peso: 3,
    badge: "border-vw-borde bg-vw-claro text-vw",
    burbuja: "bg-vw-azul",
    titulo: "Observaciones",
    icono: "text-vw-azul",
    ficha: "border-vw-borde bg-vw-claro",
    cifra: "text-vw",
  },
};

export function tonoSeveridad(severidad) {
  const texto = String(severidad ?? "")
    .toLowerCase()
    .trim();
  if (!texto) return "neutro";
  if (/(graves?|cr[ií]tic|sever|alt[ao]s?|alto|alta)/.test(texto))
    return "grave";
  if (/(moderad|media|medio)/.test(texto)) return "moderado";
  if (/(leve|baja|bajo|observ|info)/.test(texto)) return "leve";
  return "neutro";
}

export function estiloTono(severidad) {
  return TONOS[tonoSeveridad(severidad)] || TONOS.neutro;
}

export function contarSeveridades(danos = []) {
  const conteo = { grave: 0, moderado: 0, leve: 0, neutro: 0 };
  for (const dano of danos) conteo[tonoSeveridad(dano?.severidad)] += 1;
  return conteo;
}

export function ordenarPorGravedad(danos = []) {
  return [...danos].sort(
    (a, b) => estiloTono(a?.severidad).peso - estiloTono(b?.severidad).peso,
  );
}
