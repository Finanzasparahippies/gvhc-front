import { useCallback, useEffect, useState, useMemo } from 'react';
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

import { useNotes } from '../utils/NotesContext';
import APIvs from '../utils/APIvs';
import { SearchBar } from './searchBar/SearchBar';
import CustomResizableNode from './nodes/NotesNode';
import NotesNode from './nodes/NotesNode';
import NonresizableNode from './nodes/NonresizableNode';
import CustomEdge from './nodes/CustomEdges';
import { TooltipNode, AnnotationNode } from './nodes';

import { Slide, slidesToElements } from './Slides';

// Memoized node and edge types to avoid React Flow warnings
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
  const [panOnDrag, setPanOnDrag] = useState(true); // Controlar el arrastre del fondo
  
  const { fitView } = useReactFlow();

  const onNodeChange = (id, newValue) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, note: newValue } } : node
      )
    );
  };

  const handleNodeChange = (nodeId, newNote) => {
    updateNote(nodeId, newNote); // Actualiza las notas en el contexto
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
        draggable: !node.pinned, // Deshabilita el arrastre si el nodo está fijado
      };
    });
  };

  const fetchNodes = useCallback(async (searchQuery = '') => {
    const url = searchQuery ? `/answers/search/?query=${searchQuery}` : '/answers/faqs/';
    const pinnedNodes = JSON.parse(localStorage.getItem('pinnedNodes')) || [];
    const savedNotes = JSON.parse(localStorage.getItem('agentNotes')) || {};

    try {
      const response = await APIvs.get(url);
      console.log('Response:', response);
      const data = response.data.results || [];
      const apiNodes = [];
      const apiEdges = [];

      data.forEach((faq) => {
        const uniqueId = `faq-${faq.id}`;
        const isPinned = pinnedNodes.some((pinnedNode) => pinnedNode.id === uniqueId);

        const nodeData = {
          label: faq.question || 'No Title',
          answerText: faq.answers[0]?.answer_text || 'No Content',
          template: faq.answers[0]?.template || '',
          image: faq.answers[0]?.image_url || null,
          response_type: faq.response_type,
          keywords: faq.keywords || [],
          note: savedNotes[uniqueId] || '',
          pinned: isPinned, // Marca el nodo como fijado si está en pinnedNodes
          onChange: (newNote) => handleNodeChange(uniqueId, newNote),
        };

        const nodeStyle = {
          border: isPinned ? '2px solid red' : '2px solid black',
          backgroundColor: '#fff',
          borderRadius: 8,
        };

        const node = {
          id: uniqueId,
          type: faq.answers[0]?.node_type || 'NonresizableNode',
          position: { x: 0, y: 0 },
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
      });

      const distributedNodes = distributeNodesInGrid(apiNodes, 8, 700, 1000);
      setNodes(distributedNodes);
      setEdges(apiEdges);

      setTimeout(() => {
        fitView({ padding: 0.1 });
      }, 0);

      return distributedNodes;
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

  const handleNodeClick = (event, node) => {
    event.stopPropagation(); // Evita que el evento clic se propague más allá del nodo

    setNodes((currentNodes) => {
      const updatedNodes = currentNodes.map((n) =>
        n.id === node.id
          ? {
              ...n,
              pinned: !n.pinned,
              draggable: n.pinned, // Cambia el estado de arrastre según si está fijado o no
              style: {
                ...n.style,
                border: n.pinned ? '1px solid black' : '2px solid red',
              },
            }
          : n
      );
      const hasPinned = updatedNodes.some((n) => n.data?.pinned);
      setPanOnDrag(!hasPinned); // Deshabilitar pan si hay nodos pineados

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
          panOnDrag={panOnDrag} // Habilita o deshabilita el arrastre del fondo
          fitView
          maxZoom={2}
          minZoom={0.2}
          style={{ border: '2px solid #ccc' }}
        >
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              switch (node.type) {
                case 'NonresizableNode':
                  return '#0070f3';
                case 'NoteNode':
                  return '#f39';
                default:
                  return '#ddd';
              }
            }}
            style={{ width: 150, height: 80 }}
          />
          <Background color="#ddd" variant={BackgroundVariant.Cross} gap={12} />
        </ReactFlow>
        <div className="save-restore">
          <button onClick={() => localStorage.setItem('nodes', JSON.stringify(nodes))}>Guardar</button>
          <button onClick={() => setNodes(JSON.parse(localStorage.getItem('nodes') || '[]'))}>Restaurar</button>
        </div>
      </div>
    </>
  );
};

export default ReactFlowComponent;
