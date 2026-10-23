//src/lib/reporte.js
const escapar = (valor) =>
  String(valor ?? "").replace(
    /[&<>"]/g,
    (car) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[car],
  );

const lista = (titulo, elementos) =>
  elementos?.length
    ? `<h2>${escapar(titulo)}</h2><ul>${elementos
        .map((elemento) => `<li>${escapar(elemento)}</li>`)
        .join("")}</ul>`
    : "";

export function construirReporte({ resultado, fecha }) {
  const danos = resultado.danos || [];
  const objetosAjenos = resultado.objetos_ajenos || [];
  const meta = [
    ["Unidad", resultado.unidad],
    ["VIN", resultado.vin],
    ["Fecha de análisis", fecha],
    ["Estado general", resultado.estado_general],
    ["Nivel de atención", resultado.nivel_atencion],
    ["Imágenes analizadas", resultado.total_imagenes],
    ["Daños detectados", danos.length],
    ["Objetos ajenos", objetosAjenos.length],
  ]
    .filter(([, valor]) => String(valor ?? "").trim() !== "")
    .map(
      ([clave, valor]) =>
        `<tr><th>${escapar(clave)}</th><td>${escapar(valor)}</td></tr>`,
    )
    .join("");

  const hallazgos = danos.length
    ? `<h2>Hallazgos detectados (${danos.length})</h2>${danos
        .map(
          (dano, indice) => `<article class="dano">
        <header><span class="num">${indice + 1}</span>
        <strong>${escapar(dano.pieza)} · ${escapar(dano.tipo)}</strong>
        <span class="sev">${escapar(dano.severidad)}</span></header>
        <p>${escapar(dano.descripcion)}</p>
        ${dano.evidencia ? `<small>Evidencia: ${escapar(dano.evidencia)}</small>` : ""}
      </article>`,
        )
        .join("")}`
    : "<p>No se identificaron daños suficientemente claros en las imágenes proporcionadas.</p>";

  const objetosHtml = objetosAjenos.length
    ? `<h2>Objetos ajenos detectados (${objetosAjenos.length})</h2>${objetosAjenos
        .map(
          (objeto, indice) => `<article class="dano">
        <header><span class="num naranja">${indice + 1}</span>
        <strong>${escapar(objeto.objeto)}</strong></header>
        <p>${escapar(objeto.descripcion)}</p>
        ${objeto.ubicacion ? `<small>Ubicación: ${escapar(objeto.ubicacion)}</small>` : ""}
        ${objeto.evidencia ? `<small>Evidencia: ${escapar(objeto.evidencia)}</small>` : ""}
      </article>`,
        )
        .join("")}`
    : "";

  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8" />
<title>Reporte de inspección${resultado.unidad ? ` · ${escapar(resultado.unidad)}` : ""}</title>
<style>
  body{font-family:Inter,system-ui,sans-serif;color:#001e50;margin:0;padding:32px;background:#f2f6fb}
  .hoja{max-width:860px;margin:0 auto;background:#fff;border:1px solid #dbe6f2;border-radius:16px;padding:32px}
  h1{margin:0;font-size:24px} h2{font-size:15px;margin:28px 0 10px;color:#0072ce}
  .marca{font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#64748b}
  table{width:100%;border-collapse:collapse;margin-top:16px;font-size:13px}
  th{text-align:left;color:#64748b;font-weight:500;padding:7px 0;border-bottom:1px solid #eef3f9;width:200px}
  td{padding:7px 0;border-bottom:1px solid #eef3f9}
  ul{margin:0;padding-left:18px;font-size:13px;line-height:1.7;color:#334155}
  p{font-size:13px;line-height:1.7;color:#334155}
  .dano{border:1px solid #dbe6f2;border-radius:12px;padding:12px 14px;margin-bottom:10px;background:#f8fafc}
  .dano header{display:flex;align-items:center;gap:8px;margin-bottom:6px}
  .num{background:#0b3d91;color:#fff;border-radius:999px;width:20px;height:20px;display:grid;place-items:center;font-size:11px}
  .num.naranja{background:#c2410c}
  .sev{margin-left:auto;font-size:11px;border:1px solid #dbe6f2;border-radius:999px;padding:2px 8px;background:#fff}
  small{color:#64748b}
  .pie{margin-top:28px;font-size:11px;color:#94a3b8;border-top:1px solid #eef3f9;padding-top:12px}
</style></head>
<body><div class="hoja">
  <p class="marca">Inspección visual automotriz</p>
  <h1>Reporte de inspección${resultado.unidad ? ` · ${escapar(resultado.unidad)}` : ""}</h1>
  <table>${meta}</table>
  <h2>Resumen general</h2>
  <p>${escapar(resultado.resumen_general)}</p>
  ${hallazgos}
  ${objetosHtml}
  ${lista("Recomendaciones", resultado.recomendaciones)}
  ${lista("Limitaciones del análisis", resultado.limitaciones)}
  ${lista("Zonas no evaluadas", resultado.zonas_no_evaluadas)}
  <p class="pie">Generado por AutoInspect AI. Los hallazgos deben validarse con una revisión física.</p>
</div></body></html>`;
}

export function descargarReporte(datos) {
  const contenido = construirReporte(datos);
  const blob = new Blob([contenido], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  const fecha = new Date().toISOString().slice(0, 10);
  enlace.href = url;
  enlace.download = `reporte-inspeccion-${fecha}.html`;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
