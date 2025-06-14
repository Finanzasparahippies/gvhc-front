import React, { memo } from 'react';
import { FiMapPin } from 'react-icons/fi'; // Ícono para el pin

export const CustomResizableNode: React.FC<CustomResizableNodeProps> = ({ data }) => {

  const { id, title, imageUrl, note, pinned, onChange, onPinToggle } = data;

  return (
    <div
      className={`relative bg-white border ${
        pinned ? 'border-red-500' : 'border-gray-300'
      } rounded-lg shadow-md flex flex-col overflow-hidden w-[300px] h-auto min-h-[150px]`} // Ajusta width/height si es necesario
    >
      {/* Botón de pin */}
      <button
        className="absolute top-2 right-2 text-gray-500 hover:text-red-500 z-10" // Z-index para asegurar que esté sobre la imagen/texto
        onClick={() => onPinToggle(id)} // Pasa el ID del nodo
      >
        <FiMapPin className={`w-6 h-6 ${pinned ? 'text-red-500' : ''}`} />
      </button>

      <div className="p-2 flex-grow">
        {/* Título del nodo */}
        {title && (
          <h3 className="font-bold text-lg mb-2 text-gray-800 break-words">{title}</h3>
        )}

        {/* Muestra la imagen si existe imageUrl */}
        {imageUrl && (
          <div className="mb-2 max-h-[200px] overflow-hidden rounded-md">
            <img src={imageUrl} alt={title || "Node Image"} className="w-full h-auto object-contain" />
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(CustomResizableNode);
