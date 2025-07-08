import { Node, XYPosition } from '@xyflow/react';


type FAQStep = {
    id: number | string;
    number: number;
    text: string;
    image_url: string | undefined;
    keywords?: string[];
};

type Answer = {
    id: number | string;
    title: string;
    answer_text: string;
    template?: string;
    image_url?: string | undefined;
    node_type?: string;
    steps?: FAQStep[];
    excel_file?: string
};

type ResponseTypeData = {
    id: number;
    type_name: string;
    description?: string;
}

type FAQ = {
    pos_y?: number;
    pos_x?: number;
    id: number | string;
    question: string;
    position: {
        pos_x: number;
        pos_y: number;
    };
    response_type?: ResponseTypeData;
    keywords?: string[];
    answers: Answer[];
    slides?: any[]; // Define mejor si tienes estructura
};

type Department = {
    id: number | string;
    name: string;
    description?: string;
}

interface GroupNodeData extends BaseNodeData {
    type: 'group';
    departmentId: number | string; // El ID del departamento
    departmentName: string; // El nombre del departamento
}


interface BasePayload { // Renamed from the original "BasePayload" content
    id?: number | string;
    data?:{
        id?: number | string;
        data?: {};
        width?: number;
        height?: number;
        sourcePosition?:any;
        title: string;
        groupId: string;
        NodeType?: string;
        draggable?: boolean;
        questionText?: string;
        answerText?: string;
        template?: string;
        imageUrl?: string | undefined;
        response_type?: string;
        borderColor?: string;
        keywords?: string[];
        steps?: FAQStep[];
        note?: string;
        pinned?: boolean;
        label?: string;
        tooltip?: string;
    excel_file?: string;
    label?: string; // For TooltipNode
    tooltip?: string; // For TooltipNode
    onPinToggle: (id: string) => void;
    onChange?: (nodeId: string, newNote: string) => void;
    onTemplateChange?: (nodeId: string, newTemplate: string) => void;
    setPanOnDrag?: (enabled: boolean) => void;
}
position?:{
    x:number, y:numer
}
[key: string]: any; // Important for flexibility if you add more properties dynamically
}
interface SearchBarProps {
    query: string;
    setQuery: React.Dispatch<React.SetStateAction<string>>;
    fetchNodes: (query: string) => Promise<Node<BasePayload>[]>;
}

type PinnedNodeInfo = {
    id: number | string;
    data?: BasePayload;
    type?: string; // The type of the node, e.g., 'QuestionNode'
    position?: XYPosition;
};

export type NodeTypeStyle = {
    backgroundColor: string;
    borderColor: string;
    // Puedes añadir más propiedades de estilo aquí si las necesitas en el futuro
};

export type NodeDimensions = {
    width: number;
    height: number;
};
