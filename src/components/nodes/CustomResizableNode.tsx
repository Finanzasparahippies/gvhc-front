import { Handle, Position, NodeProps, Node, NodeResizeControl } from '@xyflow/react';
import React, { memo } from 'react';
import { CgArrowsExpandLeft } from "react-icons/cg";
import { BasePayload } from '../../types/nodes';
import  {getCombinedNodeStyle, nodeStyles}  from '../../utils/nodeStyles'; // Asegúrate de la ruta correcta
import StepsRenderer from './StepRender';


export const CustomResizableNode: React.FC<NodeProps<Node<BasePayload>>> =  ({ data, id, isConnectable, type }) => {
  // Asegúrate de que `data` y `data.steps` existen antes de intentar acceder a ellos
  const { 
      title, 
      answerText, 
      imageUrl, 
      note, 
      template, 
      onChange, 
      onTemplateChange, 
      setPanOnDrag, 
      onPinToggle, 
      pinned, 
      borderColor,
      steps,
    } = data;
    const nodeStyle = getCombinedNodeStyle(data.response_data, pinned);
    const handleFocus = () => setPanOnDrag && setPanOnDrag(false);
    const handleBlur = () => setPanOnDrag && setPanOnDrag(true);
    const controlStyle = {
        background: 'transparent',
        border: 'none',
    };
    const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (onChange) {
        onChange(id, e.target.value);
      }
    };

  const handleTemplateChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (onTemplateChange) {
      onTemplateChange(id, e.target.value);
    }
  };

  const handlePinClick = () => {
    if (onPinToggle) {
      onPinToggle(id);
    }
  };

  return (
    <div 
      style={nodeStyle}
      className={`relative rounded-lg shadow-md flex flex-col overflow-hidden border-2`}
    >
      <NodeResizeControl
            style={ controlStyle }
            minHeight={ 350 }
            minWidth={ 300 }
            >
        {/* <BsTextareaResize/> */}
        <ResizeIcon/>
      </NodeResizeControl>
      <Handle
        type="source"
        position={Position.Bottom}
        id="output-handle"
        isConnectable={isConnectable}
        className="!bg-green-500 !w-3 !h-3" // Estilos Tailwind para el handle
      />

      <Handle
        type="target"
        position={Position.Top}
        id="input-handle"
        isConnectable={isConnectable}
        className="!bg-blue-500 !w-3 !h-3" // Estilos Tailwind para el handle
      />
      {/* Botón de pin */}
      <button
        className="absolute top-2 right-2 text-gray-500 hover:text-blue-600 focus:outline-none z-10 group"
        onClick={() => onPinToggle && onPinToggle(id)}
      >
        <span className="text-xl">
          {pinned ? '📌' : '📍'}
        </span>
        <span className="
          absolute bottom-full mb-2 left-1/2 -translate-x-1/2
          px-2 py-1 bg-gray-700 text-white text-xs rounded-md
          opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap
          pointer-events-none
        ">
          {pinned ? 'Desanclar' : 'Anclar'}
      </span>
      </button>

      <div className="p-4 flex-grow overflow-y-auto">
        {/* Título del nodo */}
        {title && (
          <h3 className="font-bold text-lg mb-2 text-blue-700 break-words">{title}</h3>
        )}
        {imageUrl && (
          <div className="mb-2 overflow-hidden rounded-md">
            <img src={imageUrl} alt={title || "Node Image"} className="w-full h-auto object-contain" />
          </div>
        )}
        {answerText && (
          <p className="text-gray-700 mb-2 leading-relaxed">{answerText}</p>
        )}

        {template && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h5 className="font-semibold text-md mb-2 text-gray-700">Plantilla:</h5>
            <textarea
              className="w-full min-h-[120px] p-3 border border-gray-300 rounded-md text-sm font-mono resize-y bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={template}
              onChange={handleTemplateChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder="Contenido de la plantilla..."
            />
          </div>
        )}

        {/* {steps && steps.length > 0 && <StepsRenderer steps={steps} />} */}

        {/* <div className="mt-4 pt-4 border-t border-gray-200">
          <h5 className="font-semibold text-md mb-2 text-gray-700">Notas del Agente:</h5>
          <textarea
            className="w-full min-h-[80px] p-3 border border-gray-300 rounded-md text-sm resize-y bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-400"
            placeholder="Añadir una nota de agente..."
            value={note || ''}
            onChange={handleNoteChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
        </div> */}
      </div>
    </div >
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
