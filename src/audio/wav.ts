/**
 * Codificación de un AudioBuffer a WAV (PCM 16-bit, intercalado) — tarea 6.3.
 *
 * Formato mínimo y universal: cabecera RIFF/WAVE + datos PCM. Sin dependencias.
 */

/** Convierte un AudioBuffer a un Blob WAV (PCM 16-bit little-endian). */
export function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numCanales = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const numFrames = buffer.length;
  const bytesPorMuestra = 2; // 16-bit
  const blockAlign = numCanales * bytesPorMuestra;
  const dataSize = numFrames * blockAlign;

  const ab = new ArrayBuffer(44 + dataSize);
  const view = new DataView(ab);

  const escribirStr = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i));
  };

  // Cabecera RIFF/WAVE.
  escribirStr(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  escribirStr(8, 'WAVE');
  escribirStr(12, 'fmt ');
  view.setUint32(16, 16, true); // tamaño del sub-chunk fmt
  view.setUint16(20, 1, true); // formato PCM
  view.setUint16(22, numCanales, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true); // byte rate
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 8 * bytesPorMuestra, true); // bits por muestra
  escribirStr(36, 'data');
  view.setUint32(40, dataSize, true);

  // Datos: intercalar canales y convertir float [-1,1] → int16.
  const canales: Float32Array[] = [];
  for (let c = 0; c < numCanales; c++) canales.push(buffer.getChannelData(c));

  let offset = 44;
  for (let i = 0; i < numFrames; i++) {
    for (let c = 0; c < numCanales; c++) {
      const muestra = Math.max(-1, Math.min(1, canales[c][i]));
      view.setInt16(offset, muestra < 0 ? muestra * 0x8000 : muestra * 0x7fff, true);
      offset += 2;
    }
  }

  return new Blob([ab], { type: 'audio/wav' });
}
