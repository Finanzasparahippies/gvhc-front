type FAQStep = {
    number: number;
    text: string;
    image_url: string | null;
    keywords?: string[];
};

type Answer = {
    id: string;
    title: string;
    answer_text: string;
    template?: string;
    image_url?: string | null;
    node_type?: string;
    steps?: FAQStep[];
};

type FAQ = {
    pos_y: number;
    pos_x: number;
    id: number;
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

type NodePayload = {
  // Datos del FAQ/Answer original
    id: number | string; // El ID de la Faq del backend
    title: string;
    NodeType: string;
    position: {
        pos_x: number;
        pos_y: number;
    };
    draggable: boolean;
    questionText: string; // Vendría de Faq.question
    answerText?: string; // Vendría de Answer.answer_text
    template?: string; // Vendría de Answer.template
    imageUrl?: string | null; // Vendría de Answer.image (serializada como URL)
    response_type?: string; // Nombre del ResponseType de la Faq
    borderColor?: string;
    keywords?: string[]; // De Faq.keywords
    steps?: FAQStep[]; // De Answer.steps
    // Estado y callbacks manejados por React Flow o tu componente
    note?: string;
    pinned?: boolean;
    // Callbacks que tus nodos customizados podrían necesitar invocar:
    onPinToggle?: (nodeId: string) => void;
    onChange?: (nodeId: string, newNote: string) => void;
    onTemplateChange?: ( nodeId: string, newTemplate: string) => void
  // setPanOnDrag es más global, pero si un nodo específico debe controlarlo, podría ir aquí.
  // setPanOnDrag?: (enabled: boolean) => void;
};

interface NodeData {
    questionText: string;
    response_type: string;
    imageUrl?: string;
    excel_file?: string;
    answerText?: string;
    title: string;
    template?: string;
    id: string;
    borderColor?: string;
    setPanOnDrag?: (value: boolean) => void;
    onChange?: (id: string, value: { template: string }) => void;
    onPinToggle: (id: string) => void;
    pinned?: boolean;
}

interface NonResizableNodeProps {
    data: NodeData;
}

interface CustomResizableNodeProps {
    data: {
        id: string; // Añadir id, ya que onPinToggle lo necesita
        title: string; // Para mostrar el título
        imageUrl?: string | null; // Para la URL de la imagen
        note?: string;
        pinned: boolean; // pinned también lo necesitas aquí
        onChange: (newNote: string) => void;
        onPinToggle: (nodeId: string) => void; // onPinToggle espera nodeId
    };
}
interface NoteNodeData {
    id: string;
    note?: string;
    pinned?: boolean;
    setPanOnDrag?: (value: boolean) => void;
    onPinToggle?: (id: string) => void;
    onChange: (id: string, data: { note: string }) => void;
}

interface NoteNodeProps {
    data: NoteNodeData;   
}

interface QuestionNodeProps {
    data: {
        label: string;
    };
}


interface TemplateNodeData {
    id: string;
    questionText: string;
    template?: string;
    answerText?: string;
    pinned?: boolean;
    setPanOnDrag?: (enabled: boolean) => void;
    onPinToggle: (id: string) => void;
    onChange?: (id: string, data: { template: string }) => void;
    onTemplateChange?: ( id:string, newTemplate: string ) => void;
}

interface TemplateNodeProps {
    data: TemplateNodeData;
}

interface TooltipNodeProps {
    data: {
        label: string;
        tooltip: string;
    };
}

interface SearchBarProps {
    query: string;
    setQuery: React.Dispatch<React.SetStateAction<string>>;
    setNodes: React.Dispatch<React.SetStateAction<Node<NodePayload>[]>>;  // Aquí es donde debes usar el tipo correcto
    fetchNodes: (query: string) => Promise<Node<NodePayload>[]>;
}