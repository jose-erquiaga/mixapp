/**
 * Panel del editor de pista: onda + creación de bloques (WaveformEditor) y
 * listado de bloques de la pista (BlockList).
 */

import { Track, Block } from '@/types/model';
import { colorParaPista } from '@/util/color';
import { WaveformEditor } from './WaveformEditor';
import { BlockList } from './BlockList';

export interface EditorPanelProps {
  track: Track;
  bloques: Block[];
  onCrearBloque: (b: Omit<Block, 'id'>) => void;
  onActualizarBloque: (id: string, cambios: Partial<Omit<Block, 'id' | 'trackId'>>) => void;
  onEliminarBloque: (id: string) => void;
}

export function EditorPanel({
  track,
  bloques,
  onCrearBloque,
  onActualizarBloque,
  onEliminarBloque,
}: EditorPanelProps) {
  const color = colorParaPista(track.id);

  return (
    <div className="editor-panel">
      <WaveformEditor
        track={track}
        bloques={bloques}
        color={color}
        onCrearBloque={({ etiqueta, inicioSeg, finSeg }) =>
          onCrearBloque({ trackId: track.id, etiqueta, inicioSeg, finSeg, color })
        }
      />
      <BlockList
        bloques={bloques}
        fileRef={track.fileRef}
        onActualizarEtiqueta={(id, etiqueta) => onActualizarBloque(id, { etiqueta })}
        onEliminar={onEliminarBloque}
      />
    </div>
  );
}
