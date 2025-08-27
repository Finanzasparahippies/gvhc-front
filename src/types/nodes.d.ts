import { Node, XYPosition } from '@xyflow/react';


type FAQStep = {
    id: number | string;
    number: number;
    text: string;
    image_url?: string;
    excel_content?: any; // Añadido para el paso 3, si tu 'excel_content' en los steps es una estructura compleja
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
    id: number | string;
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
    response_type: ResponseTypeData;
    keywords?: string[];
    answers: Answer[];
    slides?: any[]; // Define mejor si tienes estructura
};

type Department = {
    id: number | string;
    name: string;
    description?: string;
}

interface BaseNodeData {
    id: string; // Asegura que el ID de BaseNodeData sea string y obligatorio
    // Otras propiedades comunes a todos los datos de nodo
}
interface GroupNodeData extends BaseNodeData {
    type: 'group';
    departmentId: number | string; // El ID del departamento
    departmentName: string; // El nombre del departamento
}


export interface BasePayload { // Renamed from the original "BasePayload" content
    id?: string;
    width?: number;
    height?: number;
    sourcePosition?:any;
    title: string;
    groupId: string;
    draggable?: boolean;
    questionText?: string;
    answerText?: string;
    template?: string;
    imageUrl?: string | undefined;
    borderColor?: string;
    keywords?: string[];
    steps?: FAQStep[];
    note?: string;
    pinned?: boolean;
    response_data?:string;
    label?: string;
    tooltip?: string;
    excel_file?: string;
    label?: string; // For TooltipNode
    tooltip?: string; // For TooltipNode
    NodeType: ResponseTypeData;
    onChange?: (nodeId: string, newNote: string) => void;
    onTemplateChange?: (nodeId: string, newTemplate: string) => void;
    setPanOnDrag?: (enabled: boolean) => void;
    onPinToggle?: (id: string) => void;
    position?:{
        x:number, y:numer
    }
    [key: string]: any; // Important for flexibility if you add more properties dynamically
}
interface SearchBarProps {
    query: string;
    setQuery: React.Dispatch<React.SetStateAction<string>>;
    fetchNodes: (query: string) => Promise<Node<BasePayload>[]>;
    className?: string;
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

export interface LiveQueueStatusData {
    QueueName: string;
    commType: string;
    intervals: string; // La marca de tiempo formateada
    // Si tienes otras columnas en tu SELECT, agrégalas aquí
}

export interface LiveQueueStatusApiResponse {
    getLiveQueueStatusData: LiveQueueStatusData[];
}

export interface CallsUpdateMessage {
    type: 'callsUpdate';
    payload: {
        getCallsOnHoldData?: CallOnHold[]; // Para tus llamadas en espera existentes
        liveQueueStatus?: LiveQueueStatusData[]; // Para la nueva consulta de Live Queue Status
    };
}

interface HeartbeatMessage {
  type: 'heartbeat';
  // puedes añadir payload si quieres
}