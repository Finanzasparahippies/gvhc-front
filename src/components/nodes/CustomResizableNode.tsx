import { Handle, Position, NodeProps, Node, NodeResizeControl } from '@xyflow/react';
import React, { memo } from 'react';
import { FiMapPin } from 'react-icons/fi'; // Ícono para el pin
import { CgArrowsExpandLeft } from "react-icons/cg";
import { BasePayload } from '../../types/nodes';
import  {getCombinedNodeStyle}  from '../../utils/nodeStyles'; // Asegúrate de la ruta correcta


const controlStyle = {
  background: 'transparent',
  border: 'none',
};

export const CustomResizableNode: React.FC<NodeProps<Node<BasePayload>>> = (props) => {

  const { id, data, type } = props;
  console.log('data:', data)
  const nodeStyle = getCombinedNodeStyle(data.response_data, data.pinned);
  const onPinToggle = data.onPinToggle;

  console.log('data (BasePayload):', data); // ¡Ahora data es directamente tu BasePayload!
  return (
    <div
      style={nodeStyle}
      className={`relative rounded-lg shadow-md flex flex-col overflow-hidden w-full h-full`} // Ajusta tus clases TailwindCSS
    >
      <NodeResizeControl style={ controlStyle } minHeight={ 50 } minWidth={ 100 }>
        {/* <BsTextareaResize/> */}
        <ResizeIcon/>
      </NodeResizeControl>
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="output-handle"/>
      
      <Handle
        type="target"
        position={Position.Top}
        id="input-handle" // Es buena práctica dar un id, aunque sea simple
      />
      {/* Botón de pin */}
      <button
        className="absolute top-2 right-2 text-gray-500 hover:text-red-500 z-10"
        onClick={() => onPinToggle && onPinToggle(id)} 
      >
          {data.pinned ? '📌' : '📍'} {/* Emoji de pin para indicar el estado */}
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
    <CgArrowsExpandLeft
      style={{ position: 'absolute', right: 5, bottom: 5 }}
      size={13}
      className='text-[#ff0235]'
    />
    // <svg
    //   width="20"
    //   xmlns="http://www.w3.org/2000/svg"
    //   height="20"
    //   viewBox="0 0 24 24"
    //   strokeWidth="2"
    //   stroke="#ff0071"
    //   fill="none"
    //   strokeLinecap="round"
    //   strokeLinejoin="round"
    // >
    //   <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    //   <polyline points="16 20 20 20 20 16" />
    //   <line x1="14" y1="14" x2="20" y2="20" />
    //   <polyline points="8 4 4 4 4 8" />
    //   <line x1="4" y1="4" x2="10" y2="10" />
    // </svg>
  );
}

export default memo(CustomResizableNode);
