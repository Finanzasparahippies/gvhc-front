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
import { getLayoutedElements } from '../utils/dagreLayout';

// const INITIAL_X = 50; // Posición X inicial para el primer nodo
// const INITIAL_Y = 50; // Posición Y inicial para el primer nodo
// const COLUMNS = 5; // Número de grupos (pregunta + respuestas) por fila. Ajústalo a 8 si quieres 8 columnas.
// const QUESTION_NODE_HEIGHT = 40; // Altura estimada de tu QuestionNode. Ajusta si tu QuestionNode es más alto/bajo.
// const ANSWER_NODE_WIDTH_ESTIMATED = 600; // Ancho estimado de tus nodos de respuesta (TemplateNode, NotesNode, etc.)
// const ANSWER_NODE_HEIGHT_ESTIMATED = 500; // Alto estimado de tus nodos de respuesta. ¡Este es CRÍTICO para evitar solapamientos verticales!
// const HORIZONTAL_GROUP_SPACING = 100; // Espacio horizontal entre grupos de preguntas/respuestas
// const VERTICAL_GROUP_SPACING = 100; // Espacio vertical entre filas de grupos de preguntas/respuestas
// const ANSWERS_PER_ROW = 10; // Cuántas respuestas quieres apilar horizontalmente bajo una pregunta.


type PinnedNodeInfo = { id: string; data?: { pinned?: boolean } /* o lo que sea que guardes */ };

const node_Types: NodeTypes  = {
  CustomResizableNode: CustomResizableNode,
  NotesNode: NotesNode,
  NonResizableNode: NonResizableNode,
  Slide: Slide,
  TooltipNode: TooltipNode,
  QuestionNode: QuestionNode,
  TemplateNode: TemplateNode,
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

  const getGroupDimensions = (groupNodes: Node[]) => {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    groupNodes.forEach(node => {
        const estimatedDimensions = getGroupDimensionsByType(node.type);
        const nodeWidth = node.width || estimatedDimensions.width;
        const nodeHeight = node.height || estimatedDimensions.height;

        minX = Math.min(minX, node.position.x);
        minY = Math.min(minY, node.position.y);
        maxX = Math.max(maxX, node.position.x + nodeWidth);
        maxY = Math.max(maxY, node.position.y + nodeHeight);
    });

    return {
        width: maxX - minX,
        height: maxY - minY,
        minX: minX,
        minY: minY
    };
};

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
          // console.log(`Toggling node ${nodeId} to pinned: ${newPinnedState}`);
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
      const data: FAQ[] = response.data.results || response.data || [];
      console.log('ResponseData:', data);
      const apiNodes: Node<BasePayload>[] = [];
      const apiEdges: Edge[] = [];
      let currentX = 0;
      let currentY = 0;
      let rowHeight = 500;
      let columnIndex = 0;

      data.forEach((faq: FAQ) => {
      const groupNodes: Node<BasePayload>[] = [];
      const groupEdges: Edge[] = [];

      const questionNodeId = `faq-question-${faq.id}`;
      const isQuestionPinned = pinnedNodesInfo.some((pn) => pn.id === questionNodeId);
      const { width: qWidth, height: qHeight } = getGroupDimensionsByType('QuestionNode');

      const questionNodeData = {
        id: questionNodeId,
        title: faq.question || 'No Question Title',
        groupId: questionNodeId,
        NodeType: faq.response_type,
        questionText: faq.question,
        setPanOnDrag,
        onPinToggle: togglePinNode,
        pinned: isQuestionPinned,
      };

      const answersPerRow = 8;
      const answerGapX = 600;
      const answerGapY = 800;
      let maxAnswerWidth = 0;
      let maxAnswerHeight = 0;

      // 1. Generar nodos de respuesta
      faq.answers.forEach((answer, answerIndex) => {
        const answerNodeId = `faq-${faq.id}-answer-${answer.id}`;
        const nodeType = answer.node_type;
        const isAnswerNodePinned = pinnedNodesInfo.some((pn) => pn.id === answerNodeId);
        const { width: aWidth, height: aHeight } = getGroupDimensionsByType(nodeType);

        maxAnswerWidth = Math.max(maxAnswerWidth, aWidth);
        maxAnswerHeight = Math.max(maxAnswerHeight, aHeight);

        const col = answerIndex % answersPerRow;
        const row = Math.floor(answerIndex / answersPerRow);

        const answerX = col * (aWidth + answerGapX);
        const answerY = row * (aHeight + answerGapY) + qHeight + 60;

        const answerNodeData = {
          id: answerNodeId,
          title: answer.title || 'No Title',
          groupId: questionNodeId,
          NodeType: faq.response_type,
          response_data: nodeType,
          questionText: faq.question || 'No Title',
          answerText: answer.answer_text || '',
          template: answer.template || '',
          imageUrl: answer.image_url,
          keywords: faq.keywords,
          steps: answer.steps,
          excel_file: answer.excel_file,
          note: agentNotes[answerNodeId] || '',
          pinned: isAnswerNodePinned,
          draggable: !isAnswerNodePinned,
          onChange: handleNoteChange,
          onPinToggle: togglePinNode,
          onTemplateChange: handleTemplateUpdate,
          setPanOnDrag,
        };

        groupNodes.push({
          id: answerNodeId,
          type: nodeType,
          style: { width: aWidth, height: aHeight },
          position: { x: answerX, y: answerY },
          draggable: !isAnswerNodePinned,
          data: answerNodeData,
        });

        groupEdges.push({
          id: `${questionNodeId}->${answerNodeId}`,
          source: questionNodeId,
          target: answerNodeId,
          type: 'smoothstep',
          animated: true,
        });
      });

      // 2. Calcular centro de la grilla para ubicar el nodo de pregunta
      const numAnswers = faq.answers.length;
      const totalCols = Math.min(numAnswers, answersPerRow);
      const totalGridWidth = totalCols * maxAnswerWidth + (totalCols - 1) * answerGapX;
      const questionX = totalGridWidth / 2 - qWidth / 2;

      groupNodes.unshift({
        id: questionNodeId,
        type: 'QuestionNode',
        position: { x: questionX, y: 0 },
        draggable: !isQuestionPinned,
        style: { width: qWidth, height: qHeight },
        data: questionNodeData,
      });

      // 3. Obtener tamaño del grupo
      const { width: groupWidth, height: groupHeight } = getGroupDimensions(groupNodes);

      // 4. Mover grupo completo a posición global
      const offsetGroupNodes = groupNodes.map((node) => ({
        ...node,
        position: {
          x: node.position.x + currentX,
          y: node.position.y + currentY,
        },
      }));

      apiNodes.push(...offsetGroupNodes);
      apiEdges.push(...groupEdges);

      // 5. Avanzar a la siguiente columna o fila
      if (columnIndex >= answersPerRow - 1) {
        columnIndex = 0;
        currentX = 0;
        currentY += groupHeight + answerGapY;
        rowHeight = 0;
      } else {
        currentX += groupWidth + answerGapX;
        columnIndex++;
        rowHeight = Math.max(rowHeight, groupHeight);
      }
    });

    setNodes(apiNodes);
    setEdges(apiEdges);
            return apiNodes;

        } catch (error) {
            console.error('Error fetching nodes:', error);
            return [];
        }
    }, [handleNoteChange, handleTemplateUpdate, setEdges, setNodes, setPanOnDrag, togglePinNode]); // Dependencias actualizadas

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


return (
<>
  <div className='w-full' style={{ height: 'calc(100vh - 120px)' }}>
<div className="w-full px-6 py-4 flex flex-row items-center justify-between space-x-4 z-10 relative">
  {/* ColorPicker a la izquierda */}
  <div className="flex-shrink-0">
    <ColorPicker onChangeColor={setBackgroundColor} />
  </div>

  {/* SearchBar al centro y expandido */}
  <div className="flex-grow flex justify-center">
    <SearchBar
      query={query}
      setQuery={setQuery}
      fetchNodes={fetchNodes}
      className="w-full max-w-2xl"
    />
  </div>

  {/* CustomAttribution a la derecha */}
  <div className="flex-shrink-0">
    <CustomAttribution />
  </div>
</div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onConnect={onConnect}
        onNodesChange={onNodesChange}
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
                return typeStyle.backgroundColor;
                }}
          nodeBorderRadius={50}
          nodeStrokeColor={(node: Node<BasePayload>) => {
                const typeStyle = getCombinedNodeStyle(node.data?.response_data);
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