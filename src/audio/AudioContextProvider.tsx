/**
 * Provider que asegura que el AudioContext sea reanudado tras un gesto del usuario.
 * Los navegadores modernos suspenden el audio hasta que el usuario interactúa
 * con la página (click, tap, etc.); este componente lo reanuda automáticamente.
 */

import { ReactNode, useEffect } from 'react';
import { resumeAudioContext } from './audioContext';

export function AudioContextProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Reanudar AudioContext al interactuar con la página
    const resume = () => resumeAudioContext();
    document.addEventListener('click', resume);
    document.addEventListener('touchstart', resume);

    return () => {
      document.removeEventListener('click', resume);
      document.removeEventListener('touchstart', resume);
    };
  }, []);

  return <>{children}</>;
}
