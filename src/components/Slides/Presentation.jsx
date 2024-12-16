import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ReactFlow, useReactFlow, ReactFlowProvider, Background, Controls } from '@xyflow/react';
import  slidesToElements from './slides';
import Slide from './Slide';
import APIvs from '../../utils/APIvs';
import '@xyflow/react/dist/style.css';

// Función para cargar nodos desde la API
const loadSlidesFromAPI = async () => {
    const response = await APIvs.get('/answers/faqs/');
    const slides = {};

    response.data.forEach((faq) => {
        slides[faq.id] = { source: faq.question, right: String(Number(faq.id) + 1) };
    });

    return slides;
};

export function App() {
    const [currentSlide, setCurrentSlide] = useState('1');
    const { fitView } = useReactFlow();

    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);

    const handleKeyPress = useCallback(
        (event) => {
            const slide = nodes.find((node) => node.id === currentSlide);
            const direction = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' }[event.key];
            const target = slide?.[direction];

            if (target) {
                setCurrentSlide(target);
                fitView({ nodes: [{ id: target }] });
            }
        },
        [currentSlide, fitView, nodes]
    );

    // Asigna y elimina el event listener de teclas
    useEffect(() => {
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [handleKeyPress]);
        

    useEffect(() => {
        const loadSlides = async () => {
        const slides = await loadSlidesFromAPI();
        const { nodes: loadedNodes, edges: loadedEdges } = slidesToElements(currentSlide, slides);
        setNodes(loadedNodes);
        setEdges(loadedEdges);
        };
        loadSlides();
    }, [currentSlide]);

    const handleNodeClick = useCallback((_, node) => {
        setCurrentSlide(node.id);
        fitView({ nodes: [node] });
    }, [fitView]);

    return (
        <ReactFlowProvider>
        <ReactFlow
            nodes={nodes}
            edges={edges}
            fitView
            onNodeClick={handleNodeClick}
            nodeTypes={{ slide: Slide }}
            fitViewOptions={{ nodes: [{ id: currentSlide }] }}
        >
            <Background color="#f2f2f2" />
            <Controls />
        </ReactFlow>
        </ReactFlowProvider>
    );
    
}

export default App;