import { memo } from 'react';
import {
    BaseEdge,
    EdgeLabelRenderer,
    getStraightPath,
    useReactFlow,
    } from '@xyflow/react';
    
    function CustomEdge({ id, sourceX, sourceY, targetX, targetY }) {
        const { setEdges } = useReactFlow();
        const [edgePath, labelX, labelY] = getStraightPath({
        sourceX,
        sourceY,
        targetX,
        targetY,
        });
    
        return (
        <>
            <BaseEdge id={id} path={edgePath} />
                <EdgeLabelRenderer>
                    <button
                        className='absolute pointer-events-auto nodrag nopan'
                        style={{
                            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`
                        }}
                        onClick={() => {
                        setEdges((es) => es.filter((e) => e.id !== id));
                        }}
                    >
                        delete
                    </button>
                </EdgeLabelRenderer>
        </>
        );
    }
    export default memo(CustomEdge);
