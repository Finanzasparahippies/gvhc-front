import { memo } from 'react';
import { Handle, Position, NodeResizeControl } from '@xyflow/react';

const controlStyle = {
  background: 'transparent',
  border: 'none',
};

const CustomResizableNode = ({ data, selected }) => {
  return (
    <div
      className={`relative bg-white ${
        selected ? 'border-2 border-blue-500' : 'border border-gray-300'
      } rounded-lg shadow-md flex flex-col overflow-hidden`}
      style={{
        resize: 'both',
        minWidth: '150px',
        minHeight: '100px',
        position: 'relative',
      }}
    >
      {/* Control personalizado para redimensionar */}
      <NodeResizeControl style={controlStyle} minWidth={150} minHeight={100}>
        <ResizeIcon />
      </NodeResizeControl>

      {/* Handles para conexión */}
      <Handle type="target" position={Position.Top} />
      <div className="flex-1 flex flex-col justify-center items-center px-4 py-2 overflow-auto">
        {/* Título */}
        <strong className="text-center text-gray-800">
          {data.label || 'Label'}
        </strong>
        {/* Texto dinámico */}
        <p
          className="text-sm text-gray-600 break-words w-full"
          style={{
            fontSize: `${Math.max((data.width || 200) / 20, 12)}px`, // Ajusta la fuente según el ancho
            lineHeight: '1.2',
          }}
        >
          {data.answerText || 'No Content'}
        </p>
      </div>
      <Handle type="source" position={Position.Bottom} />
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
