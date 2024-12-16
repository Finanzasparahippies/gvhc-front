import { memo } from 'react';
import { NodeToolbar } from '@xyflow/react';

const TooltipNode = ({ data }) => {
    return (
        <div className="relative group">
        <div className="node-tooltip border p-2 rounded-md bg-white shadow-md">
            {data.label}
        </div>
        <NodeToolbar isVisible={true} className="hidden group-hover:block">
            <div className="tooltip bg-gray-800 text-white p-2 rounded">
            {data.tooltip}
            </div>
        </NodeToolbar>
        </div>
    );
};

export default memo(TooltipNode);
