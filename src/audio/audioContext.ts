/**
 * Acceso centralizado al AudioContext compartido.
 *
 * Web Audio exige que el contexto se cree/reanude tras un gesto del usuario,
 * por eso se instancia de forma perezosa y se ofrece `resumeAudioContext`.
 */

let contextoCompartido: AudioContext | null = null;

/** Devuelve el AudioContext compartido, creándolo en el primer uso. */
export function getAudioContext(): AudioContext {
  if (!contextoCompartido) {
    contextoCompartido = new AudioContext();
  }
  return contextoCompartido;
}

/** Reanuda el contexto si el navegador lo dejó suspendido (autoplay policy). */
export async function resumeAudioContext(): Promise<void> {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }
}
