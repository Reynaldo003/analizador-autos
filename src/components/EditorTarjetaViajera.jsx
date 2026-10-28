import { useEffect, useState } from "react";

// Tamaño de las páginas de la plantilla proporcionada, en puntos PDF.
const VALORES_VACIOS = {};
const ANCHO_PDF = 609;
const ALTO_PDF = 794.25;

export default function EditorTarjetaViajera({
    cita,
    campos = [],
    valoresIniciales = VALORES_VACIOS,
    onGuardar,
    onDescargar,
    onCerrar,
}) {
    const [pagina, setPagina] = useState(1);
    const [valores, setValores] = useState(valoresIniciales);
    const [operacion, setOperacion] = useState("");
    const [mensaje, setMensaje] = useState("");

    useEffect(() => {
        setValores(valoresIniciales);
        setMensaje("");
    }, [valoresIniciales]);

    useEffect(() => {
        setPagina(1);
    }, [cita?.id]);

    function actualizarCampo(nombre, valor) {
        setValores((anteriores) => ({ ...anteriores, [nombre]: valor }));
        setMensaje("");
    }

    function renderCampoFormulario(campo) {
        const valor = valores[campo.nombre];

        if (campo.tipo === "casilla") {
            return (
                <label key={campo.nombre} className="flex items-center gap-3 rounded-lg border border-slate-200 p-3">
                    <input
                        type="checkbox"
                        checked={Boolean(valor)}
                        onChange={(e) => actualizarCampo(campo.nombre, e.target.checked)}
                        className="h-5 w-5 accent-blue-800"
                    />
                    <span className="text-sm text-slate-700">{campo.titulo}</span>
                </label>
            );
        }

        if (campo.tipo === "opcion") {
            return (
                <label key={campo.nombre} className="block space-y-1">
                    <span className="text-xs font-semibold text-slate-700">{campo.titulo}</span>
                    <select
                        value={valor ?? ""}
                        onChange={(e) => actualizarCampo(campo.nombre, e.target.value)}
                        className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
                    >
                        <option value="">Sin seleccionar</option>
                        {campo.opciones.map((opcion) => (
                            <option key={opcion.valor} value={opcion.valor}>
                                {opcion.titulo}
                            </option>
                        ))}
                    </select>
                </label>
            );
        }

        const tipoInput = {
            texto: "text",
            numero: "number",
            fecha: "date",
            hora: "time"
        }[campo.tipo] || "text";

        return (
            <label key={campo.nombre} className="block space-y-1">
                <span className="text-xs font-semibold text-slate-700">{campo.titulo}</span>
                <input
                    type={tipoInput}
                    min={campo.tipo === "numero" ? 0 : undefined}
                    step={campo.tipo === "numero" ? "any" : undefined}
                    value={valor ?? ""}
                    onChange={(e) => actualizarCampo(campo.nombre, e.target.value)}
                    className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-600"
                />
            </label>
        );
    }

    function renderCampoDocumento(campo) {
        const posicion = (x, y) => ({
            left: `${(x / ANCHO_PDF) * 100}%`,
            top: `${(y / ALTO_PDF) * 100}%`,
            transform: "translate(-50%, -50%)"
        });

        if (campo.tipo === "casilla") {
            return (
                <button
                    key={campo.nombre}
                    type="button"
                    title={campo.titulo}
                    aria-label={campo.titulo}
                    aria-pressed={Boolean(valores[campo.nombre])}
                    onClick={() => actualizarCampo(campo.nombre, !valores[campo.nombre])}
                    className="absolute hidden h-3 w-3 place-items-center text-sm font-bold text-blue-800 xl:grid"
                    style={posicion(campo.x, campo.y)}
                >
                    {valores[campo.nombre] ? "×" : ""}
                </button>
            );
        }

        if (campo.nombre === "nivel_gasolina") {
            // Mismas medidas y niveles que el backend V5 (tarjeta_viajera.py).
            const niveles = { reserva: 0, "1/4": 2, "1/2": 4, "3/4": 6, lleno: 8 };
            const cantidad = niveles[String(valores[campo.nombre] ?? "").trim().toLowerCase()] ?? 0;
            const x0 = 231.5;
            const x1 = 259.4;
            const alto = 11.6;
            const paso = 12.8;
            const base = 369.7;

            return (
                <div key={campo.nombre}>
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute"
                        style={{
                            left: `${(231.7 / ANCHO_PDF) * 100}%`,
                            top: `${(371.6 / ALTO_PDF) * 100}%`,
                            width: `${(27.6 / ANCHO_PDF) * 100}%`,
                            height: `${(9.5 / ALTO_PDF) * 100}%`,
                            backgroundColor: "rgb(0, 102, 184)",
                        }}
                    />
                    {Array.from({ length: cantidad }, (_, indice) => {
                        const yInferior = base - indice * paso;
                        return (
                            <div
                                key={indice}
                                aria-hidden="true"
                                className="pointer-events-none absolute"
                                style={{
                                    left: `${(x0 / ANCHO_PDF) * 100}%`,
                                    top: `${((yInferior - alto) / ALTO_PDF) * 100}%`,
                                    width: `${((x1 - x0) / ANCHO_PDF) * 100}%`,
                                    height: `${(alto / ALTO_PDF) * 100}%`,
                                    backgroundColor: "rgb(0, 102, 184)",
                                }}
                            />
                        );
                    })}
                    {campo.opciones.map((opcion) => (
                        <button
                            key={`${campo.nombre}-${opcion.valor}`}
                            type="button"
                            title={`${campo.titulo}: ${opcion.titulo}`}
                            aria-label={`${campo.titulo}: ${opcion.titulo}`}
                            aria-pressed={valores[campo.nombre] === opcion.valor}
                            onClick={() => actualizarCampo(campo.nombre, opcion.valor)}
                            className="absolute hidden h-3 w-5 rounded-sm hover:bg-blue-300/30 xl:block"
                            style={posicion(opcion.x, opcion.y)}
                        />
                    ))}
                </div>
            );
        }

        if (campo.tipo === "opcion") {
            return campo.opciones.map((opcion) => (
                <button
                    key={`${campo.nombre}-${opcion.valor}`}
                    type="button"
                    title={`${campo.titulo}: ${opcion.titulo}`}
                    aria-label={`${campo.titulo}: ${opcion.titulo}`}
                    aria-pressed={valores[campo.nombre] === opcion.valor}
                    onClick={() => actualizarCampo(
                        campo.nombre,
                        valores[campo.nombre] === opcion.valor ? "" : opcion.valor
                    )}
                    className="absolute hidden h-3 w-3 place-items-center text-sm font-bold text-blue-800 xl:grid"
                    style={posicion(opcion.x, opcion.y)}
                >
                    {valores[campo.nombre] === opcion.valor ? "×" : ""}
                </button>
            ));
        }

        if (campo.tipo === "fecha" || campo.tipo === "hora") return null;

        return (
            <input
                key={campo.nombre}
                type={campo.tipo === "numero" ? "number" : "text"}
                title={campo.titulo}
                aria-label={campo.titulo}
                value={valores[campo.nombre] ?? ""}
                onChange={(e) => actualizarCampo(campo.nombre, e.target.value)}
                className="absolute hidden rounded-sm  px-1 text-[10px] text-blue-900 outline-none focus:border-blue-600 xl:block"
                style={{
                    left: `${(campo.x / ANCHO_PDF) * 100}%`,
                    top: `${(campo.y / ALTO_PDF) * 100}%`,
                    width: `${(campo.ancho / ANCHO_PDF) * 100}%`,
                    height: `${(campo.alto / ALTO_PDF) * 100}%`
                }}
            />
        );
    }

    const hayCambios = JSON.stringify(valores) !== JSON.stringify(valoresIniciales);

    function cerrarEditor() {
        if (operacion) return;
        if (hayCambios && !window.confirm("Tienes cambios sin guardar. ¿Deseas cerrar?")) return;
        onCerrar?.();
    }

    async function guardarCambios() {
        if (!onGuardar || !cita?.id || operacion) return;
        setOperacion("guardando");
        setMensaje("");
        try {
            await onGuardar(cita.id, valores);
            setMensaje("Cambios guardados correctamente.");
        } catch (error) {
            setMensaje(error.message || "No se pudieron guardar los cambios.");
        } finally {
            setOperacion("");
        }
    }

    async function guardarYDescargar() {
        if (!onGuardar || !onDescargar || !cita?.id || operacion) return;
        setOperacion("descargando");
        setMensaje("");
        try {
            await onGuardar(cita.id, valores);
            await onDescargar(cita.id);
            setMensaje("Tarjeta Viajera guardada y descargada.");
        } catch (error) {
            setMensaje(error.message || "No se pudo descargar el PDF.");
        } finally {
            setOperacion("");
        }
    }

    const camposPagina = campos.filter((campo) => campo.pagina === pagina);

    const seccionesPagina = Object.entries(
        camposPagina.reduce((grupos, campo) => {
            const seccion = campo.seccion || "Otros campos";
            if (!grupos[seccion]) grupos[seccion] = [];
            grupos[seccion].push(campo);
            return grupos;
        }, {})
    );

    return (
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-lg font-bold text-slate-900">Editar Tarjeta Viajera</h2>
                    <p className="text-sm text-slate-500">
                        {cita?.cliente || "Cliente sin nombre"} · {cita?.folio || `Ingreso ${cita?.id}`}
                    </p>
                </div>
                {onCerrar && (
                    <button type="button" onClick={cerrarEditor} disabled={Boolean(operacion)} className="rounded-lg border px-3 py-2 text-sm disabled:opacity-50">
                        Cerrar
                    </button>
                )}
            </div>

            <div className="flex items-center justify-center gap-3">
                <button
                    type="button"
                    onClick={() => setPagina((actual) => Math.max(1, actual - 1))}
                    disabled={pagina === 1}
                    className="rounded-lg border px-3 py-2 text-sm disabled:opacity-40"
                >
                    Anterior
                </button>
                <span className="text-sm font-semibold">Página {pagina} de 3</span>
                <button
                    type="button"
                    onClick={() => setPagina((actual) => Math.min(3, actual + 1))}
                    disabled={pagina === 3}
                    className="rounded-lg border px-3 py-2 text-sm disabled:opacity-40"
                >
                    Siguiente
                </button>
            </div>

            <div className="grid gap-5 xl:grid-cols-[minmax(0,609px)_minmax(250px,1fr)]">
                <div className="min-w-0 overflow-x-auto rounded-lg bg-slate-100 p-2">
                    <div className="relative mx-auto w-full max-w-[609px]" style={{ aspectRatio: `${ANCHO_PDF} / ${ALTO_PDF}` }}>
                        <img
                            src={`/tarjeta-viajera/pagina-${pagina}.png`}
                            alt={`Plantilla Tarjeta Viajera, página ${pagina}`}
                            className="absolute inset-0 h-full w-full"
                        />
                        {camposPagina.map(renderCampoDocumento)}
                    </div>
                </div>

                <div className="space-y-4">
                    <p className="text-sm font-semibold text-slate-700">Campos de esta página</p>
                    {camposPagina.length === 0 && (
                        <p className="text-sm text-slate-500">Aún no hay campos configurados en esta página.</p>
                    )}
                    {seccionesPagina.map(([seccion, camposSeccion], indice) => (
                        <details key={seccion} open={indice === 0 ? true : undefined} className="rounded-xl border border-slate-200">
                            <summary className="cursor-pointer bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800">
                                {seccion} ({camposSeccion.length})
                            </summary>
                            <div className="space-y-3 p-3">
                                {camposSeccion.map(renderCampoFormulario)}
                            </div>
                        </details>
                    ))}
                </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3">
                {mensaje && <p role="status" className="mr-auto text-sm text-slate-700">{mensaje}</p>}
                <button
                    type="button"
                    disabled={!onGuardar || Boolean(operacion)}
                    onClick={guardarCambios}
                    className="rounded-lg bg-blue-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                    {operacion === "guardando" ? "Guardando..." : "Guardar cambios"}
                </button>
                <button
                    type="button"
                    onClick={guardarYDescargar}
                    disabled={!onGuardar || !onDescargar || Boolean(operacion)}
                    className="rounded-lg bg-[#131E5C] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                    {operacion === "descargando" ? "Preparando PDF..." : "Guardar y descargar PDF"}
                </button>
            </div>
        </div>
    );
}
