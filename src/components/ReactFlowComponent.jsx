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

import APIvs from '../utils/APIvs';
import { SearchBar } from './searchBar/SearchBar';
// import NoteNode from './nodes/NoteNode'; // Importa el nuevo nodo
import ResizableNodeSelected from './nodes/ResizableNodeSelected';
import NonresizableNode from './nodes/NonresizableNode';
import CustomEdge from './nodes/CustomEdges';
import {TooltipNode, AnnotationNode}  from './nodes';

import { Slide, slidesToElements } from './Slides';

const nodeTypes = {
  ResizableNodeSelected,
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

  const { fitView } = useReactFlow();

  

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
        // Asegúrate de que `draggable` esté habilitado correctamente
        draggable: true,
      };
    });
  };

const fetchNodes = useCallback(async (searchQuery = '') => {
  const url = searchQuery ? `/answers/search/?query=${searchQuery}` : '/answers/faqs/';
  const pinnedNodes = JSON.parse(localStorage.getItem('pinnedNodes')) || [];

  try {
    const response = await APIvs.get(url);
    console.log('Response:', response);
    const data = response.data.results || [];
    const apiNodes = [];
    const apiEdges = [];


      data.forEach((faq) => {
        const uniqueId = `faq-${faq.id}`;
        const isPinned = pinnedNodes.some((node) => node.id === uniqueId);

        const node = {
          id: uniqueId,
          type: faq.answers[0]?.node_type || 'NonresizableNode',
          position: { x: 0, y: 0 }, // Será ajustado después
          data: {
            label: faq.question || 'No Title',
            answerText: faq.answers[0]?.answer_text || 'No Content',
            template: faq.answers[0]?.template || '',
            image: faq.answers[0]?.image_url || null,
            response_type: faq.response_type,
            keywords: faq.keywords || [],
          },
          pinned: isPinned,
          style: {
            border: isPinned ? '2px solid red' : '2px solid black',
            backgroundColor: '#fff',
            borderRadius: 8,
          },
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
              position: { x: 0, y: 0 }, // Será ajustado más adelante
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

            // Conexión desde el nodo principal al primer step
            if (index === 0) {
              apiEdges.push({
                id: `${uniqueId}->${stepNodeId}`,
                source: uniqueId,
                target: stepNodeId,
                type: 'smoothstep',
              });
            }

            // Conexión entre los steps
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

      // Aplica el nuevo layout
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
 const handleNodeClick = (event, node) => {
  event.stopPropagation(); // Evita que el evento clic se propague más allá del nodo

  setNodes((currentNodes) => {
    const updatedNodes = currentNodes.map((n) =>
      n.id === node.id
        ? {
            ...n,
            pinned: !n.pinned,
            style: {
              ...n.style,
              border: n.pinned ? '1px solid black' : '2px solid red',
            },
          }
        : n
    );
    const pinnedNodes = updatedNodes.filter((n) => n.pinned);
    localStorage.setItem('pinnedNodes', JSON.stringify(pinnedNodes));
    return updatedNodes;
  });
};

return (
  <>
    <SearchBar query={query} setQuery={setQuery} setNodes={setNodes} fetchNodes={fetchNodes} />
    <div className="mt-10" style={{ width: '100vw', height: 'calc(100vh - 350px)' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onConnect={onConnect}
        onNodesChange={onNodesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        maxZoom={2}
        minZoom={0.2}
        nodesDraggable={true}
        style={{ border: '2px solid #ccc' }}
      >
        <Controls />
        <MiniMap nodeColor="#000" style={{ width: 150, height: 80 }} />
        <Background color="#ddd" variant={BackgroundVariant.Cross} gap={12} />
      </ReactFlow>
      <div className="mt-4">
        <ZoomSlider />
      </div>
      <div className="save-restore">
        <button onClick={handleSave}>Guardar</button>
        <button onClick={handleRestore}>Restaurar</button>
      </div>

    </div>
  </>
);
};

export default ReactFlowComponent;