import { memo, useEffect, useState } from 'react';
import { Handle, Position, NodeResizer } from '@xyflow/react';

const ResizableNodeSelected = ({ data, selected }) => {
  const [imageSize, setImageSize] = useState({ width: 'auto', height: 'auto' });

  // Ajusta el tamaño del nodo según las dimensiones de la imagen.
  useEffect(() => {
    if (data.image) {
      const img = new Image();
      img.src = data.image;
      img.onload = () => {
        setImageSize({ width: img.width, height: img.height });
      };
    }
  }, [data.image]);

  return (
    <div
      style={{
        padding: 10,
        width: imageSize.width,
        height: imageSize.height,
        overflow: 'hidden', // Oculta contenido fuera de los límites
        position: 'relative', // Necesario para los handles
      }}
    >
      <NodeResizer
        color="#ff0071"
        isVisible={selected}
        minWidth={50}
        minHeight={30}
      />
      <Handle type="target" position={Position.Left} />
      <div
        style={{
          textAlign: 'center',
          width: '100%',
          height: '100%',
          overflow: 'hidden', // Oculta cualquier contenido que se salga del nodo
        }}
      >
        <strong>{data.label}</strong>
        {data.answerText && <p>{data.answerText}</p>}
        {data.image && (
          <img
            src={data.image}
            alt="Answer related"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover', // Asegura que la imagen ocupe el nodo completo
            }}
          />
        )}
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
};

export default memo(ResizableNodeSelected);
