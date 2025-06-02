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
import type { AxiosResponse } from 'axios';

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
  response_type?: string;
  keywords?: string[];
  answers: Answer[];
  slides?: any[]; // Define mejor si tienes estructura
};

type CustomNodeData = {
  id: string,
  position: {
    x: number;
    y: number
  };
  data:{
    answer_text:string;
    connections:[];
    id: number;
    image: string;
    image_url: string;
    node_type: string;
    relevance: number;
    steps: [];
    template: string;
  }
  type: string;
  label: string;
  answerText: string;
  template: string;
  image: string | null;
  response_type?: string;
  keywords: string[];
  note: string;
  pinned: boolean;
  draggable: boolean;
  onPinToggle: (id: string) => void;
  setPanOnDrag: (enabled: boolean) => void;
  onChange: (newNote: string) => void;
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
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<CustomNodeData>>([]);
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
    const originalNode = nodes.find((n: Node<CustomNodeData>) => n.id === node.id);
  
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
  

  const distributeNodesInGrid = (nodes: Node<CustomNodeData>[], nodesPerRow: number, xGap: number, yGap: number ): Node<CustomNodeData>[] => {
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
    const pinnedNodes = storedPinnedNodes ? JSON.parse(storedPinnedNodes) : [] ;
    const agentNotes = storedAgentNotes ? JSON.parse(storedAgentNotes) : [];
  
    try {
      const response: AxiosResponse = await API.get(url);
      console.log('Response:', response);
      const data = response.data.results || [];
      const apiNodes: Node<CustomNodeData>[] = [];
      const apiEdges: Edge[] = [];
  
      data.forEach((faq: { id: any; answers: { steps: any[]; }[]; data: any; question: any; response_type: any; keywords: any; slides: string | any[]; }) => {
        console.log('FAQ recibido:', faq);  // 👈 Agrega esta línea para inspeccionar qué campos llegan
        const uniqueId = `faq-${faq.id}`;
        const isPinned = pinnedNodes.some((pinnedNode) => pinnedNode.id === uniqueId);

        const nodeStyle = {
          border: isPinned ? '2px solid red' : '2px solid black',
          backgroundColor: '#fff',
          borderRadius: 8,
        };
  
        // Construye las propiedades del nodo antes de usar `node`
        const nodeData: CustomNodeData = {
          id: uniqueId,
          type: faq.answers[0]?.node_type || 'NonResizableNode',
          position: { x: 0, y: 0 },
          draggable: !isPinned,
          data: faq.data,
          label: faq.question || 'No Title',
          answerText: faq.answers[0]?.answer_text || 'No Content',
          template: faq.answers[0]?.template || '',
          image: faq.answers[0]?.image_url || null,
          response_type: faq.response_type,
          keywords: faq.keywords || [],
          note: agentNotes[uniqueId] || '', // Accede correctamente a las notas guardadas
          pinned: isPinned,
          style: nodeStyle,
          onPinToggle: togglePinNode, // Pasa la función al nodo
          setPanOnDrag,
          onChange: (newNote: string) => handleNodeChange(uniqueId, newNote),
        };
  
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
      const distributedNodes: Node<CustomNode>[] = distributeNodesInGrid(apiNodes, 8, 800, 1000);
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