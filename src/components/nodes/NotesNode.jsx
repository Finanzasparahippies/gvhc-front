import React, { useState } from 'react';
import { Handle, Position } from '@xyflow/react';

const NoteNode = ({ id, data }) => {
  const [note, setNote] = useState(data.note || ''); // Estado para la nota

    const handleNoteChange = (e) => {
        setNote(e.target.value);
        data.onChange(id, e.target.value); // Actualiza el estado del nodo en ReactFlow
    };

    const clearNote = () => {
        setNote(''); // Limpia el estado local
        data.onChange(id, ''); // Notifica al componente padre
    };

    return (
        <div className="p-4 h-[600px] w-[350px] border rounded bg-yellow-100 shadow-lg flex flex-col">
        <strong className="block mb-2 text-lg font-bold text-gray-700">
            Nota de llamada
        </strong>
        <textarea
            value={note}
            onChange={handleNoteChange}
            placeholder="Escribe tu nota aquí..."
            className="flex-grow w-full h-[480px] p-2 text-sm border rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
            onClick={clearNote}
            className="
            mt-3
            py-2 px-4
            bg-red-500
            text-white
            font-semibold
            rounded-lg
            shadow-md
            hover:bg-red-600
            focus:outline-none
            focus:ring-2
            focus:ring-red-400
            focus:ring-opacity-75
            transition
            duration-300
            "
        >
            Limpiar nota
        </button>
        <Handle type="source" position={Position.Bottom} />
        <Handle type="target" position={Position.Top} />
        </div>
    );
};

export default NoteNode;
