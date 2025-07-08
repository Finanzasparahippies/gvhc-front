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
import getCombinedNodeStyle, { getNodeStyleByType, getGroupDimensionsByType } from '../utils/nodeStyles';


const COLUMNS = 8;
const ANSWER_NODE_WIDTH = 650; // Ancho estimado de tus nodos de respuesta (ajusta según el tamaño real de tus nodos)
const ANSWER_NODE_HEIGHT = 100; // Alto estimado de tus nodos (ya lo usas)
const HORIZONTAL_SPACING = ANSWER_NODE_WIDTH + 50; // Espacio entre nodos (ancho + un margen)
const VERTICAL_SPACING = ANSWER_NODE_HEIGHT + 50; // Espacio vertical, si decides apilar después de cierta cantidad
const ANSWERS_PER_ROW = 3; // Número de respuestas por fila dentro de un grupo de preguntas/respuestas


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

  
  const togglePinNode = useCallback((nodeId: string) => {
    setNodes((currentNodes) => {
      let newPinnedState = false;
      const updatedNodes = currentNodes.map((node) => {
        if (node.id === nodeId) { // Identifica el nodo directamente por su ID
          newPinnedState = !node.data.pinned; // Obtiene el nuevo estado de pineado
          console.log(`Toggling node ${nodeId} to pinned: ${newPinnedState}`);
          return {
            ...node,
            data: { ...node.data, pinned: newPinnedState }, // Actualiza la data
            draggable: !newPinnedState,                     // Actualiza propiedad raíz draggable
            // El estilo se aplicará dentro de QuestionNode si recibe `isPinned`
          };
        }
        // También actualiza los nodos hijos si están asociados al mismo grupo
        // Asumiendo que `groupId` en los nodos de respuesta es el mismo que `nodeId` del QuestionNode
        return node;
      });

      // Guardar en localStorage solo los nodos de tipo 'QuestionNode' y que estén pineados
      setTimeout(() => {
        const flow = toObject();
        const pinnedQuestionNodes = flow.nodes.filter(
          (n) => n.data?.pinned && (n.type === 'NonResizableNode' || n.type === 'NotesNode' || n.type === 'Slide' || n.type === 'TooltipNode' || n.type === 'TemplateNode' || n.type === 'CustomResizableNode')
        );
        localStorage.setItem('pinnedNodes', JSON.stringify(pinnedQuestionNodes));
      }, 0); // Un pequeño retraso para asegurar que el estado se actualice antes de guardar

      return updatedNodes;
    });
  }, [setNodes, toObject]);
  

  const fetchNodes = useCallback(async (searchQuery = '') => {
    const storedPinnedNodes = localStorage.getItem('pinnedNodes');
    const storedAgentNotes = localStorage.getItem('agentNotes');
    const url = searchQuery ? `/api/search/?query=${searchQuery}` : '/api/faqs/';
    const pinnedNodesInfo: PinnedNodeInfo[] = storedPinnedNodes ? JSON.parse(storedPinnedNodes) : [];
    const agentNotes = storedAgentNotes ? JSON.parse(storedAgentNotes) : {};
  
    try {
      const response = await API.get<{results: FAQ[]}>(url);
      // console.log('Response:', response);
      const data: FAQ[] = response.data.results || [];
      console.log('ResponseData:', data);
      const apiNodes: Node<BasePayload>[] = [];
      const apiEdges: Edge[] = [];

      const defaultGroupDimensions = getGroupDimensionsByType(); // Obtiene las dimensiones por defecto
      let currentGroupWidth = defaultGroupDimensions.width;
      let currentGroupHeight = defaultGroupDimensions.height;
  
      data.forEach((faq: FAQ, faqIndex: number ) => {

        const faqGroupDimensions = getGroupDimensionsByType(faq.response_type?.type_name); // Usa type_name de response_type
        currentGroupWidth = faqGroupDimensions.width;
        currentGroupHeight = faqGroupDimensions.height;

        const groupX = (faqIndex % COLUMNS) * currentGroupWidth;
        const groupY = Math.floor(faqIndex / COLUMNS) * currentGroupHeight;
        const questionNodeId = `faq-question-${faq.id}`;

        const questionNodeData = {
            id: questionNodeId,
            title: faq.question || 'No Question Title',
            groupId: questionNodeId,
            NodeType: faq.response_type, 
            questionText: faq.question,
            setPanOnDrag: setPanOnDrag,
            };

            // 2. CREA EL NODO COMPLETO usando el payload anterior
            apiNodes.push({
              id: questionNodeId,
              type: 'QuestionNode',
              // position: { x: (faqIndex % 5) * 800, y: Math.floor(faqIndex / 5) * 600 },
              position: { x: groupX, y: groupY },
              draggable: true,
              data: questionNodeData, // ✅ El payload va aquí
            });

                faq.answers.forEach((answer, answerIndex) => {
                  const answerNodeId = `faq-${faq.id}-answer-${answer.id}`;
                  const nodeType = answer.node_type; // Default type
                  console.log('nodetype:',nodeType)

                  const isAnswerNodePinned = pinnedNodesInfo.some((pn) => pn.id === answerNodeId);
                  const col = answerIndex % ANSWERS_PER_ROW;
                  const row = Math.floor(answerIndex / ANSWERS_PER_ROW);
                  const answerX = groupX + (col * HORIZONTAL_SPACING);
                  const answerY = groupY + VERTICAL_SPACING + (row * VERTICAL_SPACING);

                  // 1. Construye el objeto de datos (payload) directamente
                  const answerNodeData = {
                      id: answerNodeId,
                      title: answer.title || 'No Title',
                      groupId: questionNodeId,
                      NodeType: faq.response_type,
                      response_data: nodeType,
                      questionText: faq.question || 'No Title',
                      answerText: answer.answer_text || '',
                      template: answer.template,
                      imageUrl: answer.image_url,
                      keywords: faq.keywords,
                      steps: answer.steps,
                      excel_file: answer.excel_file,
                      note: agentNotes[answerNodeId] || '',
                      pinned: isAnswerNodePinned,
                      draggable: !isAnswerNodePinned,
                      onChange: handleNoteChange,
                      onPinToggle: togglePinNode, // <-- Corregí el nombre aquí también, de tu pregunta anterior
                      onTemplateChange: handleTemplateUpdate,
                      setPanOnDrag: setPanOnDrag, // Pass
                      // Add setPanOnDrag if your nodes need it
                  };
                  // 2. Crea el nodo con la estructura correcta
                  apiNodes.push({
                      id: answerNodeId,
                      type: nodeType, // El tipo de componente a renderizar            
                      position: { x: answerX, y: answerY }, // <-- Posición ajustada
                      draggable: !isAnswerNodePinned,
                      data: answerNodeData, // 👈 Pasa el payload directamente aquí
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
            setEdges(apiEdges);
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
      className='w-full'
      style={{ height: 'calc(100vh - 120px)' }}
      >
  <div className='flex flex-row justify-around mx-5 items-center'>
    <div className='translate-x-[50px] lg:translate-x-[150px] xl:translate-x-[200px]'>
    <ColorPicker
            onChangeColor={setBackgroundColor}/>
    </div>
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
        className='border border-purple-800 rounded-lg w-screen h-full bg-slate-200'
      >
        <Controls
          showFitView={true}
        />
        <MiniMap
          nodeColor={(node: Node<BasePayload>) => {
                const typeStyle = getCombinedNodeStyle(node.data?.response_data);
                console.log(typeStyle)
                return typeStyle.backgroundColor;
                }}
          nodeBorderRadius={50}
          nodeStrokeColor={(node: Node<BasePayload>) => {
                const typeStyle = getCombinedNodeStyle(node.data?.response_data);
                console.log(typeStyle)
                return typeStyle.borderColor;
                }}
        />        
      <Background color={backgroundColor} variant={BackgroundVariant.Cross} gap={12} />
      </ReactFlow>
      {/* <div className="save-restore">
        <button onClick={handleSave}>Guardar</button>
        <button onClick={handleRestore}>Restaurar</button>
      </div> */}

    </div>
  </>
);
};

export default ReactFlowComponent;