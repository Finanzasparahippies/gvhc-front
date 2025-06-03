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
  Node,
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
  TooltipNode
} from '../components/nodes'; 
import ColorPicker from './ColorPicker';
import { Slide, slidesToElements, ZoomSlider, loadSlidesFromAPI } from '../components/Slides';
import axios from 'axios';

type FAQStep = {
  number: number;
  text: string;
  image_url: string | null;
  keywords?: string[];
};

type Answer = {
  answer_text: string;
  template?: string;
  image_url?: string | null;
  node_type?: string;
  steps?: FAQStep[];
};

type FAQ = {
  id: number;
  question: string;
  position: {
    x: number;
    y: number;
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
    x: number;
    y: number;
  };
  draggable: boolean;
  questionText: string; // Vendría de Faq.question
  answerText?: string; // Vendría de Answer.answer_text
  template?: string; // Vendría de Answer.template
  imageUrl?: string | null; // Vendría de Answer.image (serializada como URL)
  response_type?: string; // Nombre del ResponseType de la Faq
  keywords?: string[]; // De Faq.keywords
  steps?: FAQStep[]; // De Answer.steps

  // Estado y callbacks manejados por React Flow o tu componente
  note?: string;
  pinned?: boolean;
  // Callbacks que tus nodos customizados podrían necesitar invocar:
  onPinToggle?: (nodeId: string) => void;
  onChangeNote?: (nodeId: string, newNote: string) => void;
  // setPanOnDrag es más global, pero si un nodo específico debe controlarlo, podría ir aquí.
  // setPanOnDrag?: (enabled: boolean) => void;
};

const nodeTypes = {
  CustomResizableNode,
  NoteNode,
  NonResizableNode,
  Slide,
  TooltipNode,
};

const edgeTypes = {
  CustomEdge,
};

export const ReactFlowComponent = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<NodePayload>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [query, setQuery] = useState('');
  const { notes, updateNote } = useNotes();
  const [panOnDrag, setPanOnDrag] = useState(true); // Controla el pan dinámicamente
  const { fitView } = useReactFlow();
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

  const handleNodeChange = (nodeId: string, newNote: string) => {
    updateNote(nodeId, newNote); // Guardar nota en el contexto y localStorage
  };

  const handleNodeDragStop: OnNodeDrag = (event, node) => {
    console.log('🟢 Nodo soltado', node);

    const id = node.id.replace('faq-', '');
    const originalNode = nodes.find((n: Node<NodePayload>) => n.id === node.id);
  
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
  

  const distributeNodesInGrid = (nodes: Node<NodePayload>[], nodesPerRow: number, xGap: number, yGap: number ): Node<NodePayload>[] => {
    return nodes.map((node, index) => {
      const row = Math.floor(index / nodesPerRow);
      const col = index % nodesPerRow;
        return {
          ...node,
          position: {
            x: col * xGap,
            y: row * yGap,
          },
          draggable: !node.data?.pinned, 
          data: {
            ...node.data,
            setPanOnDrag: (isEnabled: boolean) => {
              if (!node.data?.pinned) setPanOnDrag(isEnabled);
            }, 
          },
        };
    });
  };
  
  const togglePinNode = (nodeId: string) => {
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
  };
  

  const fetchNodes = useCallback(async (searchQuery = '') => {
    const url = searchQuery ? `/api/answers/search/?query=${searchQuery}` : '/api/answers/faqs/';
    const pinnedNodes: PinnedNodeInfo[] = storedPinnedNodes ? JSON.parse(storedPinnedNodes) : [] ;
    const agentNotes = storedAgentNotes ? JSON.parse(storedAgentNotes) : [];
  
    try {
      const response = await API.get<{results: FAQ[]}>(url);
      console.log('Response:', response);
      const data: FAQ[] = response.data.results || [];
      const apiNodes: Node<NodePayload>[] = [];
      const apiEdges: Edge[] = [];
  
      data.forEach((faq: FAQ) => {
        console.log('FAQ recibido:', faq);  // 👈 Agrega esta línea para inspeccionar qué campos llegan
        const uniqueId = `faq-${faq.id}`;
        const isPinned = pinnedNodes.some((pinnedNode) => pinnedNode.id === uniqueId);
        const firstAnswer = faq.answers[0];

        const nodeStyle = {
          border: isPinned ? '2px solid red' : '2px solid black',
          backgroundColor: '#fff',
          borderRadius: 8,
        };
  
        // Construye las propiedades del nodo antes de usar `node`
        const nodeData: NodePayload = {
          id: uniqueId,
          NodeType: firstAnswer?.node_type || 'NonResizableNode',
          position: { x: 0, y: 0 },
          draggable: !isPinned,
          questionText: faq.question || 'No Title',
          answerText: firstAnswer?.answer_text || 'No Content',
          template: firstAnswer?.template || '',
          imageUrl: firstAnswer?.image_url || null,
          response_type: faq.response_type,
          keywords: faq.keywords || [],
          steps: firstAnswer?.steps,
          note: agentNotes[uniqueId] || '', // Accede correctamente a las notas guardadas
          pinned: isPinned,
          onPinToggle: togglePinNode, // Pasa la función al nodo
          onChangeNote: (newNote: string) => handleNodeChange(uniqueId, newNote),
        };

        const flowNodeProps: Node<NodePayload> = {
          id: uniqueId,
          type: firstAnswer?.node_type || 'NonResizableNode',
          position: { x: faq.pos_x || 0, y: faq.pos_y || 0},
        } 
      
        apiNodes.push(nodeData);
  
        if (faq.slides?.length) {
          const { nodes: slideNodes, edges: slideEdges } = slidesToElements(faq.id, faq.slides);
          apiNodes.push(...slideNodes);
          apiEdges.push(...slideEdges);
        }
  
        if (faq.answers[0]?.steps?.length) {
          faq.answers[0].steps.forEach((step, index) => {
            const stepNodeId = `faq-${faq.id}-step-${index}`;
            apiNodes.push({
              id: stepNodeId,
              type: 'NonresizableNode',
              position: { x: 0, y: 0 },
              data: {
                label: `Step ${step.number}` || 'No Title',
                answerText: step.text || 'No Content',
                image: step.image_url || null,
                response_type: faq.response_type,
                keywords: step.keywords || [],
              },
              style: {
                border: '2px solid blue',
                backgroundColor: '#f0f9ff',
                borderRadius: 8,
              },
            });
  
            if (index === 0) {
              apiEdges.push({
                id: `${uniqueId}->${stepNodeId}`,
                source: uniqueId,
                target: stepNodeId,
                type: 'smoothstep',
              });
            }
  
            if (index > 0) {
              const previousStepNodeId = `faq-${faq.id}-step-${index - 1}`;
              apiEdges.push({
                id: `${previousStepNodeId}->${stepNodeId}`,
                source: previousStepNodeId,
                target: stepNodeId,
                type: 'smoothstep',
              });
            }
          });
        }
      });
  
      // Distribuye los nodos y actualiza el estado
      const distributedNodes: Node<NodePayload>[] = distributeNodesInGrid(apiNodes, 8, 800, 1000);
      setNodes(distributedNodes);
      setEdges(apiEdges);
  
      setTimeout(() => {
        fitView({ padding: 0.1 });
      }, 0);
  
      return distributedNodes; // Devuelve los nodos para validar si hay resultados
    } catch (error) {
      console.error('Error fetching nodes:', error);
      return [];
    }
  }, []);
  
  useEffect(() => {
          const lastColor = localStorage.getItem('preferedColor')
          if (lastColor) {
              setBackgroundColor(lastColor)
          } 
      }, [])

  useEffect(() => {
    fetchNodes();
  }, [fetchNodes]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleSave = () => {
    const flow = instance.toObject();
    localStorage.setItem('teamleaderFlow', JSON.stringify(flow));
  };  

  const handleRestore = () => {
    const savedFlow = localStorage.getItem('teamleaderFlow');
    if (savedFlow) {
      const flow = JSON.parse(savedFlow);
      setNodes(flow.nodes || []);
      setEdges(flow.edges || []);
      setViewport(flow.viewport || { x: 0, y: 0, zoom: 1 });
    } else {
      alert('No hay un flujo guardado');
    }
  };  
  

 // Manejar clic en nodo (fijar o desfijar)
const handleNodeClick = useCallback(
  (event, node) => {
    event.stopPropagation(); // Evita que el evento clic se propague más allá del nodo

    setNodes((currentNodes) =>
      currentNodes.map((n) => {
        if (n.id === node.id) {
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
          nodeColor={(node) => {
            switch (node.type) {
              case 'NonresizableNode':
                return '#0070f3';
                case 'NotesNode':
                  return '#f39';
                  default:
                    return '#ddd';
                  }
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