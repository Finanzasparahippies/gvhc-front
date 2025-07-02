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
  NodeTypes,
  Edge,
  Connection,
  OnConnect,
  NodeProps
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import CustomAttribution from './CustomAttribution';
import { useNotes } from '../utils/NotesContext';
import API from '../utils/API';
import { SearchBar } from './searchBar/SearchBar';
import { 
  CustomResizableNode,
  NotesNode,
  NonResizableNode,
  CustomEdge,
  TooltipNode,
  QuestionNode,
  TemplateNode,
} from '../components/nodes'; 
import ColorPicker from './ColorPicker';
import { Slide } from '../components/Slides';
import { BasePayload, FAQ } from '../types/nodes';

type PinnedNodeInfo = { id: string; data?: { pinned?: boolean } /* o lo que sea que guardes */ };

const node_Types: NodeTypes  = {
  CustomResizableNode: CustomResizableNode,
  NotesNode: NotesNode,
  NonResizableNode: NonResizableNode,
  Slide: Slide,
  TooltipNode: TooltipNode,
  QuestionNode: QuestionNode,
  TemplateNode: TemplateNode
};

const edgeTypes = {
  CustomEdge,
};

const getNodeStyleByType = (responseType?: string) : { backgroundColor: string; borderColor: string;} => {
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

export const ReactFlowComponent: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<BasePayload>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [query, setQuery] = useState('');
  const { notes, updateNote } = useNotes();
  const [panOnDrag, setPanOnDrag] = useState(true); // Controla el pan dinámicamente
  const { fitView, toObject, setViewport } = useReactFlow();
  const [backgroundColor, setBackgroundColor] = useState<string>("#000");

  const handleNoteChange = useCallback((nodeId: string, newNote: string) => {
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

  const getCombinedNodeStyle = (nodeData: BasePayload) => {
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
    let newPinnedState = false;

    const nodeInGroup = nodes.find(n => n.data.groupId === nodeId);
    if (!nodeInGroup) return;

    newPinnedState = !nodeInGroup.data.pinned;
    console.log(`Toggling group ${nodeId} to pinned: ${newPinnedState}`);

    setNodes((currentNodes) =>
      currentNodes.map((node) => {
        if (node.data.groupId === nodeId) {
            return {
            ...node,
            data: { ...node.data, pinned: newPinnedState }, // Actualiza la data
            draggable: !newPinnedState,                    // Actualiza propiedad raíz
            // style: getCombinedNodeStyle({ ...node.data, pinned: newPinnedState }),
          };
        }
        return node;
      })
        );

        setTimeout(() => {
            const flow = toObject();
            const pinnedQuestionNodes = flow.nodes.filter(
                (n) => n.data?.pinned && n.type === 'QuestionNode'
            );
            localStorage.setItem('pinnedNodes', JSON.stringify(pinnedQuestionNodes));
        }, 0);
    }, [nodes, setNodes, toObject]);
  

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
      const apiNodes: Node<BasePayload>[] = [];
      const apiEdges: Edge[] = [];
  
      data.forEach((faq: FAQ, faqIndex: number ) => {
        const questionNodeId = `faq-question-${faq.id}`;
        const isGroupPinned = pinnedNodesInfo.some((pn) => pn.id === questionNodeId);

        const questionNodeData = {
            id: questionNodeId,
            title: faq.question || 'No Question Title',
            groupId: questionNodeId,
            NodeType: 'Question',
            questionText: faq.question,
            draggable: !isGroupPinned,
            onPinToggle: togglePinNode,
            setPanOnDrag: setPanOnDrag,
            pinned: isGroupPinned,
            response_type: faq.response_type,
            };

            // 2. CREA EL NODO COMPLETO usando el payload anterior
            apiNodes.push({
              id: questionNodeId,
              type: 'QuestionNode',
              position: { x: (faqIndex % 5) * 800, y: Math.floor(faqIndex / 5) * 600 },
              draggable: !isGroupPinned,
              data: questionNodeData, // ✅ El payload va aquí
            });

                faq.answers.forEach((answer, answerIndex) => {
                  const answerNodeId = `faq-${faq.id}-answer-${answer.id}`;
                  const typeStyle = getNodeStyleByType(faq.response_type);
                  const nodeType = answer.node_type || 'NonResizableNode'; // Default type

                  // 1. Construye el objeto de datos (payload) directamente
                  const answerNodeData = {
                      id: answerNodeId,
                      title: answer.title || 'No Title',
                      groupId: questionNodeId,
                      NodeType: nodeType,
                      questionText: faq.question || 'No Title',
                      answerText: answer.answer_text || 'No Content',
                      template: answer.template,
                      imageUrl: answer.image_url,
                      response_type: faq.response_type,
                      borderColor: typeStyle.borderColor,
                      keywords: faq.keywords,
                      steps: answer.steps,
                      excel_file: answer.excel_file,
                      note: agentNotes[answerNodeId] || '',
                      pinned: isGroupPinned,
                      draggable: !isGroupPinned,
                      onChange: handleNoteChange,
                      onPinToogle: togglePinNode,
                      onTemplateChange: handleTemplateUpdate,
                      // Add setPanOnDrag if your nodes need it
                      setPanOnDrag: setPanOnDrag, // Pass
                  };

                  // 2. Crea el nodo con la estructura correcta
                  apiNodes.push({
                      id: answerNodeId,
                      type: nodeType, // El tipo de componente a renderizar
                      position: {
                          x: ((faqIndex % 5) * 800) + 150 + (answerIndex * 420), // Ajusta la posición para que no se superponga
                          y: (Math.floor(faqIndex / 5) * 600) + 150
                      },
                      draggable: !isGroupPinned,
                      data: answerNodeData, // 👈 Pasa el payload directamente aquí
                      style: isGroupPinned ? {
                        border: '3px solid #D32F2F',
                        boxShadow: '0 0 10px rgba(211, 47, 47, 0.7)'
                      } : undefined,
                  });

                  apiEdges.push({
                      id: `${questionNodeId}->${answerNodeId}`,
                      source: questionNodeId,
                      target: answerNodeId,
                      type: 'smoothstep',
                      animated: true,
                  });
              });
            });

            setNodes(apiNodes);
            setEdges(apiEdges)

            return apiNodes;

        } catch (error) {
            console.error('Error fetching nodes:', error);
            return [];
        }
    }, [ ]);

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
            fetchNodes={fetchNodes}
            />
    <CustomAttribution />
    </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onConnect={onConnect}
        onNodesChange={onNodesChange}
        // onNodeDrag={handleNodeDragStop}
        onlyRenderVisibleElements={true}
        colorMode='system'
        nodeTypes={ node_Types }
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
          nodeColor={(node: Node<BasePayload>) => {
              const typeStyle = getCombinedNodeStyle(node.data.NodeType);
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