import { useCallback, useEffect, useState } from 'react';
import { 
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
  Node as FlowNode,
  XYPosition,
  Edge,
  Connection,
  OnConnect,
  OnNodeDrag,
  OnNodesChange,
  NodeMouseHandler,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import useGridDistribution from '../hooks/useGridDistribution';

import CustomAttribution from './CustomAttribution';
import { useNotes } from '../utils/NotesContext';
import API from '../utils/API';
import { SearchBar } from './searchBar/SearchBar';
import { 
  CustomResizableNode,
  NoteNode,
  NonResizableNode,
  CustomEdge,
  TooltipNode,
  QuestionNode,
  TemplateNode,
} from '../components/nodes'; 
import ColorPicker from './ColorPicker';
import { Slide, slidesToElements, ZoomSlider, loadSlidesFromAPI } from '../components/Slides';
import axios from 'axios';
import { Ansewers } from './grammar';

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

type PinnedNodeInfo = { id: string; data?: { pinned?: boolean } /* o lo que sea que guardes */ };

type NodePayload = {
  // Datos del FAQ/Answer original
  id: number | string; // El ID de la Faq del backend
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

const nodeTypes = {
  CustomResizableNode,
  NoteNode,
  NonResizableNode,
  Slide,
  TooltipNode,
  QuestionNode,
  TemplateNode
};

const edgeTypes = {
  CustomEdge,
};

const getNodeStyleByType = (responseType?: string) => {
    switch (responseType) {
        case 'Image':
            return {
                backgroundColor: 'rgba(204, 232, 255, 0.9)', // Un azul claro
                borderColor: '#007BFF',
            };
        case 'Text':
            return {
                backgroundColor: 'rgba(208, 245, 218, 0.9)', // Un verde claro
                borderColor: '#28A745',
            };
        case 'Process':
            return {
                backgroundColor: 'rgba(255, 236, 204, 0.9)', // Un naranja claro
                borderColor: '#FFC107',
            };
        case 'Note': // Podrías tener un tipo para las notas
            return {
                backgroundColor: 'rgba(243, 225, 255, 0.9)', // Un púrpura claro
                borderColor: '#6F42C1',
            };
        default:
            return {
                backgroundColor: 'rgba(248, 249, 250, 0.9)', // Un gris claro por defecto
                borderColor: '#6C757D',
            };
    }
};

export const ReactFlowComponent = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode<NodePayload>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [query, setQuery] = useState('');
  const { notes, updateNote } = useNotes();
  const [panOnDrag, setPanOnDrag] = useState(true); // Controla el pan dinámicamente
  const { fitView, toObject, setViewport } = useReactFlow();
  const [backgroundColor, setBackgroundColor] = useState<string>("#000");
  const storedPinnedNodes = localStorage.getItem('pinnedNodes');
  const storedAgentNotes = localStorage.getItem('agentNotes');


  const onNodeChange = (id: string, newValue: string) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, note: newValue } } : node
      )
    );
  };  


  const handleNodeChange = useCallback((nodeId: string, newNote: string) => {
    updateNote(nodeId, newNote); // Guardar nota en el contexto y localStorage
  },[updateNote]);

  const handleTemplateUpdate = useCallback(( nodeId: string, newTemplate: string ) => {
    setNodes((nds) =>
      nds.map((node) =>{
        if(node.id === nodeId) {
          return {
            ...node,
            data: { ...node.data, template: newTemplate },
          }
        }
        return node;
      })
    )
  }, [setNodes]);

  const handleNodeDragStop: OnNodeDrag = (event, node) => {
    console.log('🟢 Nodo soltado', node);

    const id = node.id.replace('faq-', '');
    const originalNode = nodes.find((n: FlowNode<NodePayload>) => n.id === node.id);
  
    if (
      originalNode?.position.x !== node.position.x ||
      originalNode?.position.y !== node.position.y
    ) {
      API.patch(`/api/faqs/${id}/`, {
        pos_x: node.position.x,
        pos_y: node.position.y,
      })
      .then((res: any) => console.log('Posición actualizada'))
      .catch((err: any) => console.error(err));
    }
  };
  
  const togglePinNode = useCallback((nodeId: string) => {
    setNodes((currentNodes) =>
      currentNodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                pinned: !node.data.pinned,
              },
              draggable: !node.data.pinned, // Cambia el estado de draggable dinámicamente
              style: {
                ...node.style,
                border: !node.data.pinned ? '2px solid red' : '2px solid black',
              },
            }
          : node
      )
    );
  
    // Actualiza el almacenamiento local para mantener la persistencia
    setTimeout(() => {
      const pinnedNodes = nodes.filter((n) => n.data?.pinned);
      localStorage.setItem('pinnedNodes', JSON.stringify(pinnedNodes));
    }, 0);
  },[setNodes]);
  

  const fetchNodes = useCallback(async (searchQuery = '') => {
    const url = searchQuery ? `/api/answers/search/?query=${searchQuery}` : '/api/answers/faqs/';
    const pinnedNodes: PinnedNodeInfo[] = storedPinnedNodes ? JSON.parse(storedPinnedNodes) : [] ;
    const agentNotes = storedAgentNotes ? JSON.parse(storedAgentNotes) : {};
  
    try {
      const response = await API.get<{results: FAQ[]}>(url);
      console.log('Response:', response);
      const data: FAQ[] = response.data.results || [];
      const apiNodes: FlowNode<NodePayload>[] = [];
      const apiEdges: Edge[] = [];
  
      data.forEach((faq: FAQ, faqIndex: number ) => {
        console.log('FAQ recibido:', faq);  // 👈 Agrega esta línea para inspeccionar qué campos llegan
        const questionNodeId = `faq-question-${faq.id}`;
        const isPinned = pinnedNodes.some((pinnedNode) => pinnedNode.id === questionNodeId);

        apiNodes.push({
          id: questionNodeId,
          type: 'QuestionNode',
          position: { x: (faqIndex % 5 ) * 800, y: Math.floor(faqIndex / 5) * 600 },
          draggable: !isPinned,
          data: {
            id: questionNodeId,
            questionText: faq.question,
            onPinToggle: togglePinNode,
            pinned: isPinned,
          } as any,
          style: {
            border: isPinned ? '3px solid #D32F2F' : undefined,
            boxShadow: isPinned ? '0 0 10px rgba(211, 47, 47, 0.7)' : 'none'
          }
        })

        faq.answers.forEach((answer, answerIndex) => {
          const answerNodeId = `faq-${faq.id}-answer-${answer.id}`;
          const typeStyle = getNodeStyleByType(faq.response_type);
          const borderColor = isPinned ? '#D32F2F' : typeStyle.borderColor; // Un rojo más fuerte para 'pinned'
          const nodeStyle = {
            border: `2px solid ${borderColor}`,
            backgroundColor: typeStyle.backgroundColor,
            borderRadius: 8,
            boxShadow: isPinned ? '0 0 10px rgba(211, 47, 47, 0.7)' : 'none', // Sombra para resaltar más si está fijado
  
          };  
          
          // Construye las propiedades del nodo antes de usar `node`
          const nodeData: NodePayload = {
            id: answerNodeId,
            NodeType: answer.node_type || 'NonResizableNode',
            position: { pos_x: 0, pos_y: 0 },
            draggable: !isPinned,
            questionText: faq.question || 'No Title',
            answerText: answer.answer_text || 'No Content',
            template: answer.template || '',
            imageUrl: answer.image_url || null,
            response_type: faq.response_type,
            borderColor: typeStyle.borderColor,
            keywords: faq.keywords || [],
            steps: answer.steps,
            note: agentNotes[answerNodeId] || '', // Accede correctamente a las notas guardadas
            pinned: isPinned,
            onPinToggle: togglePinNode, // Pasa la función al nodo
            onChange: (newNote: string) => handleNodeChange(answerNodeId, newNote),
            onTemplateChange: handleTemplateUpdate
          };

          apiNodes.push({
            id: answerNodeId,
            type: answer.node_type || 'NonResizableNode',
            // Posicionamos el nodo de respuesta debajo del nodo de la pregunta
            position: { 
                x: ((faqIndex % 5) * 800) + (answerIndex * 400), 
                y: (Math.floor(faqIndex / 5) * 600) + 150
            },
            draggable: !isPinned,
            data: nodeData,
            style: nodeStyle,
          });

          apiEdges.push({
              id: `${questionNodeId}->${answerNodeId}`,
              source: questionNodeId,
              target: answerNodeId,
              type: 'smoothstep',
              animated: true,
            });
        })
      })

      setNodes(apiNodes);
      setEdges(apiEdges);
      
      setTimeout(() => {
            fitView({ padding: 0.2 });
        }, 100);

        return apiNodes;
    } catch (error) {
        console.error('Error fetching nodes:', error);
        return [];
    }
}, [setNodes, setEdges, fitView, handleTemplateUpdate, togglePinNode, handleNodeChange, storedPinnedNodes, storedAgentNotes]);

  
  useEffect(() => {
          const lastColor = localStorage.getItem('preferedColor')
          if (lastColor) {
              setBackgroundColor(lastColor)
          } 
      }, [])

  useEffect(() => {
    fetchNodes();
  }, [fetchNodes]);

  const onConnect: OnConnect = useCallback(
  (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)),
  [setEdges]
);

  const handleSave = () => {
    const flow = toObject();
    localStorage.setItem('teamleaderFlow', JSON.stringify(flow));
  };  

  const handleRestore = () => {
    const savedFlow = localStorage.getItem('teamleaderFlow');
    if (savedFlow) {
      const flow = JSON.parse(savedFlow);
      setNodes(flow.nodes || []);
      setEdges(flow.edges || []);
      if (flow.viewport) {
      setViewport(flow.viewport || { x: 0, y: 0, zoom: 1 });
    }} else {
      alert('No hay un flujo guardado');
    }
  };  
  

 // Manejar clic en nodo (fijar o desfijar)
const handleNodeClick: NodeMouseHandler<FlowNode<NodePayload>> = useCallback(
  (event: React.MouseEvent, clickedNode: FlowNode<NodePayload>) => {
    event.stopPropagation(); // Evita que el evento clic se propague más allá del nodo

    setNodes((currentNodes) =>
      currentNodes.map((n) => {
        if (n.id === clickedNode.id) {
          const isPinned = !n.data.pinned; // Alterna el estado pineado
          return {
            ...n,
            data: {
              ...n.data,
              pinned: isPinned, // Actualiza el estado pineado
            },
            style: {
              ...n.style,
              border: isPinned ? '2px solid red' : '2px solid black', // Cambia el borde
            },
            draggable: !isPinned, // Deshabilita arrastre si está pineado
          };
        }
        return n; // Retorna nodos sin cambios
      })
    );

    // Actualiza el almacenamiento local para mantener persistencia
    setTimeout(() => {
      const pinnedNodes = nodes.filter((n) => n.data?.pinned);
      localStorage.setItem('pinnedNodes', JSON.stringify(pinnedNodes));
    }, 0);
  },
  [nodes]
);

return (
<>
    <div
      className='w-screen'
      style={{ height: 'calc(100vh - 120px)' }}
      >
  <div className='flex flex-row justify-between mx-5 items-center'>
    <ColorPicker onChangeColor={setBackgroundColor} />
    <SearchBar
            query={query}
            setQuery={setQuery}
            setNodes={setNodes}
            fetchNodes={fetchNodes}
            />
    <CustomAttribution />
    </div>
      <ReactFlow
        attributionPosition='top-left'
        nodes={nodes}
        edges={edges}
        onConnect={onConnect}
        onNodesChange={onNodesChange}
        onNodeClick={handleNodeClick}
        onNodeDrag={handleNodeDragStop}
        onlyRenderVisibleElements={true}
        colorMode='system'
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        maxZoom={2}
        minZoom={0.2}
        panOnDrag={panOnDrag}
        className='border border-purple-800 rounded-lg w-full h-full bg-slate-200'
      >
        <Controls
          showFitView={true}
        />
        <MiniMap
          nodeColor={(node: FlowNode<NodePayload>) => {
              const typeStyle = getNodeStyleByType(node.data.response_type);
                return typeStyle.backgroundColor;
                }}
        />        
      <Background color={backgroundColor} variant={BackgroundVariant.Cross} gap={12} />
      </ReactFlow>
      <div className="save-restore">
        <button onClick={handleSave}>Guardar</button>
        <button onClick={handleRestore}>Restaurar</button>
      </div>

    </div>
  </>
);
};

export default ReactFlowComponent;