import { useEffect, useState } from 'react';

/**
 * Evento no estándar que dispara Chrome/Edge/Brave (Android/escritorio) cuando la
 * PWA cumple los criterios de instalación. No está en la lib de tipos del DOM.
 */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * Expone un botón "Instalar app" solo cuando el navegador permite instalar la PWA.
 * En navegadores que no soportan `beforeinstallprompt` (p. ej. iOS Safari) devuelve
 * `puedeInstalar: false` y la instalación se hace desde el menú del navegador.
 */
export function useInstallPrompt() {
  const [evento, setEvento] = useState<BeforeInstallPromptEvent | null>(null);
  const [instalada, setInstalada] = useState(false);

  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      // Evita el mini-infobar por defecto para mostrar nuestro botón cuando queramos.
      e.preventDefault();
      setEvento(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalada(true);
      setEvento(null);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const instalar = async () => {
    if (!evento) return;
    await evento.prompt();
    await evento.userChoice;
    // El evento solo se puede usar una vez.
    setEvento(null);
  };

  return { puedeInstalar: evento !== null && !instalada, instalar };
}
