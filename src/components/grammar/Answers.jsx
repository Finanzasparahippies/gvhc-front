import React, { useEffect, useState } from 'react';
import ReactFlow, { MiniMap, Controls, Background } from 'react-flow-renderer';
import APIvs from '../../utils/APIvs';
import { SearchBar } from '../searchBar/SearchBar';

const Answers = () => {
    const [query, setQuery] = useState('');
    const [elements, setElements] = useState([]);

    const handleSearch = async () => {
        try {
            const response = await APIvs.get(`/answers/search/?query=${query}`);
            const data = response.data;

            console.log("Search API response data:", data); // Ver datos de respuesta

            const nodes = data.map((faq, index) => ({
                id: `faq-${faq.id}`,
                data: { label: faq.question || "Pregunta no disponible" }, // Asignar texto de respaldo
                position: { x: (index % 5) * 250, y: Math.floor(index / 5) * 150 },
            }));
            console.log("Generated nodes from search:", nodes);

            const edges = data.flatMap(faq =>
                faq.answers?.flatMap(answer =>
                    (answer.connections || []).map(connection => ({
                        id: `e${answer.id}-${connection.to_answer}`,
                        source: `faq-${answer.id}`,
                        target: `faq-${connection.to_answer}`,
                        label: connection.condition || 'Sin condición', // Asignar texto de respaldo
                        animated: true,
                        style: { stroke: '#3182CE', strokeWidth: 2 },
                    }))
                )
            );
            console.log("Generated edges from search:", edges);

            setElements([...nodes, ...edges]);
        } catch (error) {
            console.error("Error al buscar:", error);
        }
    };

    useEffect(() => {
        APIvs.get('/answers/faqs/')
            .then((response) => {
                const data = response.data;
                console.log("Initial API response data:", data); // Ver datos iniciales

                const nodes = data.map((answer, index) => ({
                    id: `faq-${answer.id}`,
                    data: { label: answer.answer_text || "Respuesta no disponible" }, // Asignar texto de respaldo
                    position: { x: (index % 5) * 250, y: Math.floor(index / 5) * 150 },
                }));
                console.log("Generated nodes on initial load:", nodes);

                const edges = data.flatMap(answer =>
                    (answer.connections || []).map(connection => ({
                        id: `e${answer.id}-${connection.to_answer}`,
                        source: `faq-${answer.id}`,
                        target: `faq-${connection.to_answer}`,
                        label: connection.condition || 'Sin condición', // Asignar texto de respaldo
                        animated: true,
                        style: { stroke: '#3182CE', strokeWidth: 2 },
                    }))
                );
                console.log("Generated edges on initial load:", edges);

                setElements([...nodes, ...edges]);
            })
            .catch(error => console.error("Error fetching answers:", error));
    }, []);

    useEffect(() => {
        console.log("Final elements array:", elements);
    }, [elements]);

    return (
        <div style={{ height: '100vh' }}>
            <SearchBar query={query} setQuery={setQuery} handleSearch={handleSearch} />
            
            {/* ReactFlow component to display nodes and edges */}
            <ReactFlow elements={elements}>
                <MiniMap nodeColor={() => '#3182CE'} />
                <Controls />
                <Background gap={16} />
            </ReactFlow>
        </div>
    );
};

export default Answers;