import { memo } from 'react';
import { NodeProps, NodeToolbar, Node } from '@xyflow/react';
import { BasePayload } from '../../types/nodes';


export const TooltipNode: React.FC<NodeProps<Node<BasePayload>>> = (props) => {

    const { data } = props

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
