import { Node, XYPosition } from '@xyflow/react';


type FAQStep = {
    id: string;
    number: number;
    text: string;
    image_url: string | undefined;
    keywords?: string[];
};

type Answer = {
    id: string;
    title: string;
    answer_text: string;
    template?: string;
    image_url?: string | undefined;
    node_type?: string;
    steps?: FAQStep[];
    excel_file?: string
};

type FAQ = {
    pos_y?: number;
    pos_x?: number;
    id: string;
    question: string;
    position: {
        pos_x: number;
        pos_y: number;
    };
    response_type?: string;
    keywords?: string[];
    answers: Answer[];
    slides?: any[]; // Define mejor si tienes estructura
};


interface BasePayload { // Renamed from the original "BasePayload" content
    id?: string;
    data?:{
        id?: string;
        data?: {};
        width?: number;
        height?: number;
        sourcePosition?:any;
        title: string;
        groupId: string;
        NodeType: string;
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
    id: string;
    data?: BasePayload;
    type?: string; // The type of the node, e.g., 'QuestionNode'
    position?: XYPosition;
};
