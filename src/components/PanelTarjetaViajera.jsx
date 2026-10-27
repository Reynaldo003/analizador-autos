import { useEffect, useState } from "react";
import EditorTarjetaViajera from "./EditorTarjetaViajera.jsx";
import { API_BASE } from "../lib/api.js";

export default function PanelTarjetaViajera({ cita, onCerrar }) {
    const [datos, setDatos] = useState(null);
    const [campos, setCampos] = useState([]);
    const [error, setError] = useState("");

    const url = `${API_BASE}/inspector-ai/api/citas/${cita.id}/tarjeta-viajera/`;

    useEffect(() => {
        const control = new AbortController();

        async function cargarDatos() {
            setDatos(null);
            setError("");

            try {
                const respuesta = await fetch(`${url}datos/`, {
                    signal: control.signal
                });

                if (!respuesta.ok) {
                    throw new Error(`Error HTTP ${respuesta.status}`);
                }

                const resultado = await respuesta.json();
                if (!control.signal.aborted) {
                    setDatos(resultado.datos || {});
                    setCampos(Array.isArray(resultado.campos) ? resultado.campos : []);
                };
            } catch (errorConsulta) {
                if (!control.signal.aborted) setError(errorConsulta.message);
            }
        }

        cargarDatos();
        return () => control.abort();
    }, [url]);

    async function guardarDatos(id, valores) {
        const respuesta = await fetch(`${url}datos/`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ datos: valores })
        });

        const resultado = await respuesta.json().catch(() => ({}));

        if (!respuesta.ok) {
            throw new Error(JSON.stringify(resultado) || `Error HTTP ${respuesta.status}`);
        }

        setDatos(resultado.datos);
        return resultado;
    }

    async function descargarPDF() {
        const respuesta = await fetch(url);

        if (!respuesta.ok) {
            throw new Error(`Error al generar PDF: HTTP ${respuesta.status}`);
        }

        const archivo = await respuesta.blob();
        const enlaceTemporal = URL.createObjectURL(archivo);
        const enlace = document.createElement("a");

        enlace.href = enlaceTemporal;
        enlace.download = `tarjeta_viajera_${cita.id}.pdf`;

        document.body.appendChild(enlace);
        enlace.click();
        enlace.remove();

        setTimeout(() => URL.revokeObjectURL(enlaceTemporal), 1000);
    }

    if (error) {
        return (
            <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
                {error}
                <button onClick={onCerrar} className="ml-3 underline">Cerrar</button>
            </div>
        );
    }

    if (datos === null) {
        return <p className="p-6 text-sm">Cargando Tarjeta Viajera...</p>;
    }

    return (
        <EditorTarjetaViajera
            cita={cita}
            campos={campos}
            valoresIniciales={datos}
            onGuardar={guardarDatos}
            onDescargar={descargarPDF}
            onCerrar={onCerrar}
        />
    );
}