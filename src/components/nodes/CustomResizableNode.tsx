import { Handle, Position, NodeProps, Node, NodeResizeControl } from '@xyflow/react';
import React, { memo } from 'react';
import { FiMapPin } from 'react-icons/fi'; // Ícono para el pin
import { BasePayload } from '../../types/nodes';
import { BsTextareaResize } from "react-icons/bs";


const controlStyle = {
  background: 'transparent',
  border: 'none',
};

export const CustomResizableNode: React.FC<NodeProps<Node<BasePayload>>> = (props) => {

    const { data } = props; // Desestructura solo las props de data
    const actualDraggable = data.draggable ?? data.draggable; // Use draggable from props, fallback to data.draggable


  return (
    <div
      className={`relative bg-white border ${
        data.pinned ? 'border-red-500' : 'border-gray-300'
      } rounded-lg shadow-md flex flex-col overflow-hidden`} // Ajusta width/height si es necesario
    >
      <NodeResizeControl style={ controlStyle } minHeight={ 50 } minWidth={ 100 }>
        {/* <BsTextareaResize/> */}
        <ResizeIcon/>
      </NodeResizeControl>
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
          <h3 className="font-bold text-lg mb-2 text-gray-800 break-words">{data.answerText}</h3>
        )}

        {/* Muestra la imagen si existe imageUrl */}
        {data.imageUrl && (
          <div className="mb-2 overflow-hidden rounded-md">
            <img src={data.imageUrl} alt={data.title || "Node Image"} className="w-full h-auto object-contain" />
          </div>
        )}
      </div>
    </div>
  );
};

function ResizeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      strokeWidth="2"
      stroke="#ff0071"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ position: 'absolute', right: 5, bottom: 5 }}
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <polyline points="16 20 20 20 20 16" />
      <line x1="14" y1="14" x2="20" y2="20" />
      <polyline points="8 4 4 4 4 8" />
      <line x1="4" y1="4" x2="10" y2="10" />
    </svg>
  );
}

export default memo(CustomResizableNode);
