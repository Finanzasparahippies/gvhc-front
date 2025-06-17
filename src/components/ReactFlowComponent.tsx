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
import { Slide } from '../components/Slides';

type PinnedNodeInfo = { id: string; data?: { pinned?: boolean } /* o lo que sea que guardes */ };

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
  
    if (originalNode && (
      originalNode?.position.x !== node.position.x ||
      originalNode?.position.y !== node.position.y
    )) {
      API.patch(`/api/faqs/${id}/`, {
        pos_x: node.position.x,
        pos_y: node.position.y,
      })
      .then((res: any) => console.log('Posición actualizada'))
      .catch((err: any) => console.error(err));
    }
  };

  const getCombinedNodeStyle = (nodeData: NodePayload) => {
        const baseStyle = getNodeStyleByType(nodeData.response_type);
        const pinnedStyle = {
            border: `3px solid ${baseStyle.borderColor}`, // Borde más grueso
            boxShadow: '0 0 15px rgba(255, 100, 100, 0.8)', // Sombra roja para resaltar
        };
        const defaultStyle = {
            border: `2px solid ${baseStyle.borderColor}`,
            backgroundColor: baseStyle.backgroundColor,
            borderRadius: 8,
        };

        return nodeData.pinned ? { ...defaultStyle, ...pinnedStyle } : defaultStyle;
    };

  
  const togglePinNode = useCallback((nodeId: string) => {
    setNodes((currentNodes) =>
      currentNodes.map((node) => {
        if (node.id === nodeId || node.data.id === nodeId) {
                    const isPinned = !node.data.pinned;
                    const updatedData = { ...node.data, pinned: isPinned };
                    
                    return {
                        ...node,
                        data: updatedData,
                        draggable: !isPinned,
                        style: getCombinedNodeStyle(updatedData), // Usar la nueva función de estilo
                    };
                }
                return node;
            })
        );

        setTimeout(() => {
            const flow = toObject();
            const pinnedNodes = flow.nodes.filter((n) => n.data?.pinned);
            localStorage.setItem('pinnedNodes', JSON.stringify(pinnedNodes));
        }, 0);
    }, [setNodes, toObject]);
  

  const fetchNodes = useCallback(async (searchQuery = '') => {
    const storedPinnedNodes = localStorage.getItem('pinnedNodes');
    const storedAgentNotes = localStorage.getItem('agentNotes');
    const url = searchQuery ? `/api/answers/search/?query=${searchQuery}` : '/api/answers/faqs/';
    const pinnedNodesInfo: PinnedNodeInfo[] = storedPinnedNodes ? JSON.parse(storedPinnedNodes) : [] ;
    const agentNotes = storedAgentNotes ? JSON.parse(storedAgentNotes) : {};
  
    try {
      const response = await API.get<{results: FAQ[]}>(url);
      console.log('Response:', response);
      const data: FAQ[] = response.data.results || [];
      const apiNodes: FlowNode<NodePayload>[] = [];
      const apiEdges: Edge[] = [];
  
      data.forEach((faq: FAQ, faqIndex: number ) => {
        const questionNodeId = `faq-question-${faq.id}`;
        const isGroupPinned = pinnedNodesInfo.some((pn) => pn.id === questionNodeId);

        apiNodes.push({
          id: questionNodeId,
          type: 'QuestionNode',
          position: { x: (faqIndex % 5 ) * 800, y: Math.floor(faqIndex / 5) * 600 },
          draggable: !isGroupPinned,
          data: {
            id: questionNodeId,
            questionText: faq.question,
            onPinToggle: togglePinNode,
            pinned: isGroupPinned,
          } as any,
          style: isGroupPinned ? {
            border: '3px solid #D32F2F',
            boxShadow: '0 0 10px rgba(211, 47, 47, 0.7)'
          } : undefined
        });

        faq.answers.forEach((answer, answerIndex) => {
          const answerNodeId = `faq-${faq.id}-answer-${answer.id}`;
          const typeStyle = getNodeStyleByType(faq.response_type);
          
          // Construye las propiedades del nodo antes de usar `node`
          const nodeData: NodePayload = {
            id: answerNodeId,
            title: answer.title || 'No Title',
            NodeType: answer.node_type || 'CustomResizableNode',
            position: { pos_x: 0, pos_y: 0 },
            draggable: !isGroupPinned,
            questionText: faq.question || 'No Title',
            answerText: answer.answer_text || 'No Content',
            template: answer.template || '',
            imageUrl: answer.image_url || null,
            response_type: faq.response_type,
            borderColor: typeStyle.borderColor,
            keywords: faq.keywords || [],
            steps: answer.steps,
            note: agentNotes[answerNodeId] || '', // Accede correctamente a las notas guardadas
            pinned: isGroupPinned,
            onPinToggle: () => togglePinNode(questionNodeId), // Pasa la función al nodo
            onChange: (newNote: string) => handleNodeChange(answerNodeId, newNote),
            onTemplateChange: handleTemplateUpdate
          };

          apiNodes.push({
            id: answerNodeId,
            type: answer.node_type || 'NonResizableNode',
            // Posicionamos el nodo de respuesta debajo del nodo de la pregunta
            position: { 
                x: ((faqIndex % 5) * 800) + (answerIndex * 420), 
                y: (Math.floor(faqIndex / 5) * 600) + 150
            },
            draggable: !isGroupPinned,
            data: nodeData,
            style: getCombinedNodeStyle(nodeData),
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

      return apiNodes
      
    } catch (error) {
        console.error('Error fetching nodes:', error);
        return [];
    }
}, [setNodes, setEdges, fitView, handleTemplateUpdate, togglePinNode, handleNodeChange]);

  
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
        nodes={nodes}
        edges={edges}
        onConnect={onConnect}
        onNodesChange={onNodesChange}
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