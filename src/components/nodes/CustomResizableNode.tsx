import { Handle, Position, NodeProps, Node, NodeResizeControl } from '@xyflow/react';
import React, { memo } from 'react';
import { CgArrowsExpandLeft } from "react-icons/cg";
import { BasePayload } from '../../types/nodes';
import  {getCombinedNodeStyle}  from '../../utils/nodeStyles'; // Asegúrate de la ruta correcta


const controlStyle = {
  background: 'transparent',
  border: 'none',
};

export const CustomResizableNode: React.FC<NodeProps<Node<BasePayload>>> = (props) => {

  const { id, data } = props;
  const nodeStyle = getCombinedNodeStyle(data.response_data, data.pinned);
  const onPinToggle = data.onPinToggle;

  return (
    <div
      style={nodeStyle}
      className={`relative rounded-lg shadow-md flex flex-col overflow-hidden`}
    >
      <NodeResizeControl
            style={ controlStyle }
            minHeight={ 350 }
            minWidth={ 300 }
            // maxHeight={200}
            // maxWidth={200}
            >
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
        <span className="
          absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2
          px-2 py-1 bg-gray-700 text-white text-xs rounded
          opacity-0 transition-opacity duration-300 group-hover:opacity-100 whitespace-nowrap
      ">
          {data.pinned ? 'Desanclar' : 'Anclar'}
      </span>
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
  );
}

export default memo(CustomResizableNode);
