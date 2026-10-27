
import { useState } from "react";
import { LoaderCircle, ReceiptText } from "lucide-react";
import { API_BASE } from "../lib/api.js";
export default function BotonTarjetaViajera({ bloqueado = false, onAbrir }) {
    return (
        <button
            type="button"
            onClick={onAbrir}
            disabled={bloqueado || !onAbrir}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#131E5C] px-4 text-[12px] font-semibold text-white hover:bg-[#24387C] disabled:opacity-50"
        >
            <ReceiptText size={16} />
            Generar Tarjeta Viajera
        </button>
    );
}