import { memo } from 'react';
import {
    EdgeProps,
    BaseEdge,
    EdgeLabelRenderer,
    getStraightPath,
    useReactFlow,
    } from '@xyflow/react';
    
    export const CustomEdge: React.FC<EdgeProps> = ({ id, sourceX, sourceY, targetX, targetY }) => {
        const { setEdges } = useReactFlow();
        const [edgePath, labelX, labelY] = getStraightPath({
        sourceX,
        sourceY,
        targetX,
        targetY,
        });

        const handleDelete = () => {
            setEdges((edges) => edges.filter((e) => e.id !== id));
        };
    
        return (
        <>
            <BaseEdge id={id} path={edgePath} />
                <EdgeLabelRenderer>
                    <button
                        className='absolute pointer-events-auto nodrag nopan'
                        style={{
                            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`
                        }}
                        onClick={ handleDelete }
                    >
                        delete
                    </button>
                </EdgeLabelRenderer>
        </>
        );
    }
    export default memo(CustomEdge);
