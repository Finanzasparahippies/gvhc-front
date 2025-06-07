import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

interface QuestionNodeProps {
    data: {
        label: string;
    };
}

export const QuestionNode: React.FC<QuestionNodeProps> = ({ data }) => {
    return (
        <div style={{
            padding: '10px 20px',
            backgroundColor: '#4A5568', // Un gris oscuro
            color: 'white',
            borderRadius: '8px',
            border: '2px solid #2D3748',
            textAlign: 'center',
            minWidth: '250px',
        }}>
            <h3 style={{ margin: 0, fontSize: '1.1em', fontWeight: 'bold' }}>{data.label}</h3>
            {/* Solo tiene un handle de salida para conectar con sus respuestas */}
            <Handle type="source" position={Position.Bottom} />
        </div>
    );
};

export default memo(QuestionNode);