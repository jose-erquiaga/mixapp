import { useEffect, useRef, useState } from 'react';
import './ProjectNameModal.css';

interface Props {
  abierto: boolean;
  onConfirmar: (nombre: string) => void;
  onCancelar: () => void;
}

export function ProjectNameModal({ abierto, onConfirmar, onCancelar }: Props) {
  const [nombre, setNombre] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (abierto) {
      setNombre('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [abierto]);

  if (!abierto) return null;

  const confirmar = () => {
    const n = nombre.trim();
    onConfirmar(n || 'Mi mezcla');
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') confirmar();
    if (e.key === 'Escape') onCancelar();
  };

  return (
    <div className="pnm-overlay" onClick={onCancelar}>
      <div className="pnm-dialogo" onClick={(e) => e.stopPropagation()}>
        <h3 className="pnm-titulo">Nombre de la sesion</h3>
        <input
          ref={inputRef}
          className="pnm-input"
          type="text"
          placeholder="Ej: Set del viernes"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          onKeyDown={onKey}
          maxLength={60}
        />
        <div className="pnm-acciones">
          <button className="pnm-btn pnm-btn--cancel" onClick={onCancelar}>
            Cancelar
          </button>
          <button className="pnm-btn pnm-btn--ok" onClick={confirmar}>
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
