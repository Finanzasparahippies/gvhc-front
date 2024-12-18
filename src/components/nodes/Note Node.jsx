import React, { useState } from 'react';
import { Handle, Position } from '@xyflow/react';

const NoteNode = ({ id, data }) => {
    
    const [note, setNote] = useState(data.note || ''); // Estado para la nota

    const handleNoteChange = (e) => {
        setNote(e.target.value);
        data.onChange(id, e.target.value); // Actualiza el estado del nodo en ReactFlow
    };

    return (
        <div className="p-4 border rounded bg-yellow-100 shadow-lg w-64">
        <strong className="block mb-2">Nota de llamada</strong>
        <textarea
            value={note}
            onChange={handleNoteChange}
            placeholder="Escribe tu nota aquí..."
            className="w-full p-2 text-sm border rounded"
            rows="4"
        />
        <Handle type="source" position={Position.Bottom} />
        <Handle type="target" position={Position.Top} />
        </div>
    );
};

export default NoteNode;
