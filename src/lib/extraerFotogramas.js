//src/lib/extraerFotogramas.js
function esperarEvento(elemento, evento, tiempoMaximo = 20000) {
  return new Promise((resolve, reject) => {
    const limpiar = () => {
      clearTimeout(temporizador);
      elemento.removeEventListener(evento, completar);
      elemento.removeEventListener("error", fallar);
    };
    const completar = () => {
      limpiar();
      resolve();
    };
    const fallar = () => {
      limpiar();
      reject(new Error("No se pudo leer el video."));
    };
    const temporizador = setTimeout(() => {
      limpiar();
      reject(new Error("El navegador tardó demasiado en procesar el video."));
    }, tiempoMaximo);
    elemento.addEventListener(evento, completar, { once: true });
    elemento.addEventListener("error", fallar, { once: true });
  });
}

export async function extraerFotogramas(archivo, cantidad = 6) {
  const url = URL.createObjectURL(archivo);
  const video = document.createElement("video");
  video.preload = "auto";
  video.muted = true;
  video.playsInline = true;

  try {
    const carga = esperarEvento(video, "loadedmetadata");
    video.src = url;
    video.load();
    await carga;
    if (
      !Number.isFinite(video.duration) ||
      video.duration <= 0 ||
      !video.videoWidth
    ) {
      throw new Error("El video no tiene duración o tamaño válidos.");
    }

    const escala = Math.min(1, 1600 / video.videoWidth);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(video.videoWidth * escala));
    canvas.height = Math.max(1, Math.round(video.videoHeight * escala));
    const contexto = canvas.getContext("2d");
    if (!contexto) throw new Error("No se pudo crear el lienzo del video.");

    const capturas = [];
    for (let i = 0; i < cantidad; i++) {
      const segundo = Math.min(
        video.duration - 0.05,
        (video.duration * (i + 0.5)) / cantidad,
      );
      const desplazamiento = esperarEvento(video, "seeked");
      video.currentTime = Math.max(0, segundo);
      await desplazamiento;
      contexto.drawImage(video, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (imagen) =>
            imagen
              ? resolve(imagen)
              : reject(new Error("No se pudo capturar el fotograma.")),
          "image/jpeg",
          0.84,
        );
      });
      const nombre = `${archivo.name.replace(/\.[^.]+$/, "")}-fotograma-${i + 1}.jpg`;
      capturas.push({
        archivo: new File([blob], nombre, { type: "image/jpeg" }),
        nombre: `${archivo.name} · ${segundo.toFixed(1)} s`,
        origen: "Video",
      });
    }
    return capturas;
  } finally {
    video.pause();
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(url);
  }
}
