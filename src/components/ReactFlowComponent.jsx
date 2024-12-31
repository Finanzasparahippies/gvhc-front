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
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ZoomSlider } from './Slides';
import useGridDistribution from '../hooks/useGridDistribution';

import CustomAttribution from './CustomAttribution';
import { useNotes } from '../utils/NotesContext';
import APIvs from '../utils/APIvs';
import { SearchBar } from './searchBar/SearchBar';
import CustomResizableNode from './nodes/NotesNode'; // Importa el nuevo nodo
import NotesNode from './nodes/NotesNode';
import NonresizableNode from './nodes/NonresizableNode';
import CustomEdge from './nodes/CustomEdges';
import {TooltipNode, AnnotationNode}  from './nodes';
import ColorPicker from './ColorPicker';

import { Slide, slidesToElements } from './Slides';

const nodeTypes = {
  CustomResizableNode,
  NotesNode,
  NonresizableNode,
  Slide,
  TooltipNode,
  AnnotationNode,
};

const edgeTypes = {
  CustomEdge,
};

const ReactFlowComponent = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [query, setQuery] = useState('');
  const { notes, updateNote } = useNotes();
  const [panOnDrag, setPanOnDrag] = useState(true); // Controla el pan dinámicamente
  const { fitView } = useReactFlow();
  const [backgroundColor, setBackgroundColor] = useState("#ddd");


  const onNodeChange = (id, newValue) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, note: newValue } } : node
      )
    );
  };  

  const handleNodeChange = (nodeId, newNote) => {
    updateNote(nodeId, newNote); // Guardar nota en el contexto y localStorage
  };

  const distributeNodesInGrid = (nodes, nodesPerRow = 5, xGap = 200, yGap = 150) => {
    return nodes.map((node, index) => {
      const row = Math.floor(index / nodesPerRow);
      const col = index % nodesPerRow;
  
      return {
        ...node,
        position: {
          x: col * xGap,
          y: row * yGap,
        },
        draggable: !node.data?.pinned, // Solo arrastrable si no está pineado
        data: {
          ...node.data,
          setPanOnDrag: (isEnabled) => {
            if (!node.data?.pinned) setPanOnDrag(isEnabled);
          }, // Controla panOnDrag de forma dinámica
        },
      };
    });
  };
  
  const togglePinNode = (nodeId) => {
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
    const url = searchQuery ? `/answers/search/?query=${searchQuery}` : '/answers/faqs/';
    const pinnedNodes = JSON.parse(localStorage.getItem('pinnedNodes')) || [];
    const savedNotes = JSON.parse(localStorage.getItem('agentNotes')) || {};
  
    try {
      const response = await APIvs.get(url);
      // console.log('Response:', response);
      const data = response.data.results || [];
      const apiNodes = [];
      const apiEdges = [];
  
      data.forEach((faq) => {
        const uniqueId = `faq-${faq.id}`;
        const isPinned = pinnedNodes.some((pinnedNode) => pinnedNode.id === uniqueId);
  
        // Construye las propiedades del nodo antes de usar `node`
        const nodeData = {
          label: faq.question || 'No Title',
          answerText: faq.answers[0]?.answer_text || 'No Content',
          template: faq.answers[0]?.template || '',
          image: faq.answers[0]?.image_url || null,
          response_type: faq.response_type,
          keywords: faq.keywords || [],
          note: savedNotes[uniqueId] || '', // Accede correctamente a las notas guardadas
          pinned: isPinned,
          onPinToggle: togglePinNode, // Pasa la función al nodo
          setPanOnDrag,
          onChange: (newNote) => handleNodeChange(uniqueId, newNote),
        };
  
        const nodeStyle = {
          border: isPinned ? '2px solid red' : '2px solid black',
          backgroundColor: '#fff',
          borderRadius: 8,
        };
  
        // Define el objeto `node` completamente
        const node = {
          id: uniqueId,
          type: faq.answers[0]?.node_type || 'NonresizableNode',
          position: { x: 0, y: 0 },
          draggable: !isPinned,
          data: nodeData,
          style: nodeStyle,
          pinned: isPinned,
        };
  
        apiNodes.push(node);
  
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
      const distributedNodes = distributeNodesInGrid(apiNodes, 8, 700, 1000);
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


useEffect(() => {
  console.log('Nodes:', nodes);
  console.log('Edges:', edges);
}, [nodes, edges]);



return (
<>
    <div style={{ width: '100vw', height: 'calc(100vh - 120px)' }}>
    <ColorPicker onChangeColor={setBackgroundColor} />
    <SearchBar
            query={query}
            setQuery={setQuery}
            setNodes={setNodes}
            fetchNodes={fetchNodes}
        />
      <ReactFlow
        attributionPosition='top-left'
        nodes={nodes}
        edges={edges}
        onConnect={onConnect}
        onNodesChange={onNodesChange}
        onNodeClick={handleNodeClick}
        onlyRenderVisibleElements={true}
        colorMode='system'
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        maxZoom={2}
        minZoom={0.2}
        panOnDrag={panOnDrag}
        style={{ 
          border: '2px solid #005c', 
          borderRadius: 8, 
          height: '100%', 
          width: '100%',
          backgroundColor: '#f0f9ff',
        }}
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
          style={{ width: 150, height: 100 }}
        />        
      <Background color={backgroundColor} variant={BackgroundVariant.Cross} gap={12} />
      </ReactFlow>
      <CustomAttribution />
      <div className="save-restore">
        <button onClick={handleSave}>Guardar</button>
        <button onClick={handleRestore}>Restaurar</button>
      </div>

    </div>
  </>
);
};

export default ReactFlowComponent;