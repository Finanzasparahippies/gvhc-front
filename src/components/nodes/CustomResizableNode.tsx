import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import React, { memo } from 'react';
import { FiMapPin } from 'react-icons/fi'; // Ícono para el pin
import { BasePayload } from '../../types/nodes';

export const CustomResizableNode: React.FC<NodeProps<Node<BasePayload>>> = (props) => {

    const { data } = props; // Desestructura solo las props de data
    const actualDraggable = data.draggable ?? data.draggable; // Use draggable from props, fallback to data.draggable


  return (
    <div
      className={`relative bg-white border ${
        data.pinned ? 'border-red-500' : 'border-gray-300'
      } rounded-lg shadow-md flex flex-col overflow-hidden w-[300px] h-auto min-h-[150px]`} // Ajusta width/height si es necesario
    >
      <Handle type="source" position={Position.Bottom} id="output-handle"/>
      
      <Handle
        type="target"
        position={Position.Top}
        id="input-handle" // Es buena práctica dar un id, aunque sea simple
      />
      {/* Botón de pin */}
      <button
        className="absolute top-2 right-2 text-gray-500 hover:text-red-500 z-10" // Z-index para asegurar que esté sobre la imagen/texto
        onClick={() => data.onPinToggle(data.id)} // Pasa el ID del nodo
      >
        <FiMapPin className={`w-6 h-6 ${data.pinned ? 'text-red-500' : ''}`} />
      </button>

      <div className="p-2 flex-grow">
        {/* Título del nodo */}
        {data.title && (
          <h3 className="font-bold text-lg mb-2 text-gray-800 break-words">{data.title}</h3>
        )}

        {/* Muestra la imagen si existe imageUrl */}
        {data.imageUrl && (
          <div className="mb-2 max-h-[200px] overflow-hidden rounded-md">
            <img src={data.imageUrl} alt={data.title || "Node Image"} className="w-full h-auto object-contain" />
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(CustomResizableNode);
