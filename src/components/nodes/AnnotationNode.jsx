import { memo } from 'react';

const AnnotationNode = ({ data }) => {
    return (
        <div className="annotation-node p-4 bg-yellow-100 border rounded-md">
        <strong>{data.label}</strong>
        <p>{data.annotation}</p>
        </div>
    );
};

export default memo(AnnotationNode);
