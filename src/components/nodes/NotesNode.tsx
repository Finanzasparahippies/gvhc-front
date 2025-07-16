import React, { useState, memo } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { BasePayload } from '../../types/nodes';
import { getCombinedNodeStyle } from '../../utils/nodeStyles';


export const NotesNode: React.FC<NodeProps<Node<BasePayload>>> = ({ id, data }) => {
    const {  setPanOnDrag, onChange, onPinToggle, note: initialNote } = data
    const [note, setNote] = useState<string>(data.note || ''); // Estado para la nota
    const [noteHistory, setNoteHistory] = useState<string[]>([]); 
    const nodeStyle = getCombinedNodeStyle(data.response_data, data.pinned);

    console.log('pinned?', data.pinned);



    const handleMouseEnter = () => {
        setPanOnDrag?.(false);
    };

    const handleMouseLeave = () => {
        setPanOnDrag?.(true)
    };

    const handlePinned = (event: React.MouseEvent<HTMLDivElement>): void => {
        event.stopPropagation(); // Evita propagar el clic
        onPinToggle?.(id);
    };

    const handleNoteChange = (event: React.ChangeEvent<HTMLTextAreaElement>): void => {
        const updatedNote = event.target.value;
        setNoteHistory((prev) => [...prev, note]); // Agregar el valor actual al historial
        setNote(updatedNote);
        if (data.onChange) {
            data.onChange(id, updatedNote); // Pasa el ID del nodo
        }    
    };

    const clearNote = () => {
        setNoteHistory((prev) => [...prev, note]); // Agregar el valor actual al historial
        setNote(''); // Limpia la nota
        onChange?.(id, '' );
    };

    return (
        <>
        <div 
            className="absolute top-0 right-0 p-2 text-sm text-gray-700 cursor-pointer"
            onClick={handlePinned}
            >
                {data.pinned ? '📌' : '📍'} {/* Emoji de pin para indicar el estado */}
                </div>
        <div 
            className="p-4 h-full border rounde shadow-lg flex flex-col"
            style={nodeStyle}
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
            className="flex-grow nowheel w-full p-2 text-sm border rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        <Handle type="source" position={Position.Bottom} id={'question'}/>
        <Handle type="target" position={Position.Top} id={'answer'}/>
        </div>
    </>
    );
};

export default memo(NotesNode);
