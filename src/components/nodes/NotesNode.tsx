import React, { useState, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';

interface NoteNodeData {
    id: string;
    note?: string;
    pinned?: boolean;
    setPanOnDrag?: (value: boolean) => void;
    onPinToggle?: (id: string) => void;
    onChange: (id: string, data: { note: string }) => void;
}

interface NoteNodeProps {
    data: NoteNodeData;   
}

export const NoteNode: React.FC<NoteNodeProps> = ({ data }) => {
    const [note, setNote] = useState<string>(data.note || ''); // Estado para la nota
    const [noteHistory, setNoteHistory] = useState<string[]>([]); 

    const handleMouseEnter = () => {
        data.setPanOnDrag?.(false);
    };

    const handleMouseLeave = () => {
        data.setPanOnDrag?.(true)
    };

    const handlePinned = (event: React.MouseEvent<HTMLDivElement>): void => {
        event.stopPropagation(); // Evita propagar el clic
        data.onPinToggle?.(data.id);
    };

    const handleNoteChange = (event: React.ChangeEvent<HTMLTextAreaElement>): void => {
        const updatedNote = event.target.value;
        setNoteHistory((prev) => [...prev, note]); // Agregar el valor actual al historial
        setNote(updatedNote);
        data.onChange(data.id, { note: updatedNote });
    };

    const clearNote = () => {
        setNoteHistory((prev) => [...prev, note]); // Agregar el valor actual al historial
        setNote(''); // Limpia la nota
        data.onChange(data.id, { note: '' });
    };

    return (
        <>
        <div 
            className="absolute top-0 right-0 p-2 text-sm text-gray-700 cursor-pointer"
            onClick={handlePinned}
            >
                {data.pinned ? 'Unpin' : 'Pin'}
                </div>
        <div 
            className="p-4 h-[600px] w-[350px] border rounded bg-yellow-100 shadow-lg flex flex-col"
            style={{ border: data.pinned ? '2px solid red' : '2px solid black' }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            >
        <strong className="block mb-2 text-lg font-bold text-gray-700">
            Nota de llamada
        </strong>
        <textarea
            value={note}
            onChange={handleNoteChange}
            placeholder="Escribe tu nota aquí..."
            className="flex-grow nowheel w-full h-[480px] p-2 text-sm border rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
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
    </>
    );
};

export default NoteNode;
