import React, { memo } from 'react';
import { FiMapPin } from 'react-icons/fi'; // Ícono para el pin

interface CustomResiseNodeProps {
  data: {
    pinned: boolean;
    note?: string;
    onChange: (newNote: string) => void;
    onTogglePin?: () => void;
  }
}

export const CustomResizableNode: React.FC<CustomResiseNodeProps> = ({ data }) => {
  return (
    <div
      className={`relative bg-white border ${
        data.pinned ? 'border-red-500' : 'border-gray-300'
      } rounded-lg shadow-md flex flex-col overflow-hidden`}
    >
      {/* Botón de pin */}
      <button
        className="absolute top-2 right-2 text-gray-500 hover:text-red-500"
        onClick={data.onTogglePin} // Maneja el evento de pin
      >
        <FiMapPin className={`w-6 h-6 ${data.pinned ? 'text-red-500' : ''}`} />
      </button>
      <textarea
        className="w-full h-full p-2 resize-none"
        value={data.note}
        onChange={(e) => data.onChange(e.target.value)}
        placeholder="Escribe tu nota aquí..."
      />
    </div>
  );
};

export default memo(CustomResizableNode);
