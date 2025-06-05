import React, { useState, ChangeEvent, KeyboardEvent } from 'react';
import { FiSearch } from 'react-icons/fi';
import { Node } from '@xyflow/react'

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
  pos_y: number;
  pos_x: number;
  id: number;
  question: string;
  position: {
    pos_x: number;
    pos_y: number;
  };
  response_type?: string;
  keywords?: string[];
  answers: Answer[];
  slides?: any[]; // Define mejor si tienes estructura
};

type NodePayload = {
  // Datos del FAQ/Answer original
  id: number | string; // El ID de la Faq del backend
  NodeType: string;
  position: {
    pos_x: number;
    pos_y: number;
  };
  draggable: boolean;
  questionText: string; // Vendría de Faq.question
  answerText?: string; // Vendría de Answer.answer_text
  template?: string; // Vendría de Answer.template
  imageUrl?: string | null; // Vendría de Answer.image (serializada como URL)
  response_type?: string; // Nombre del ResponseType de la Faq
  keywords?: string[]; // De Faq.keywords
  steps?: FAQStep[]; // De Answer.steps

  // Estado y callbacks manejados por React Flow o tu componente
  note?: string;
  pinned?: boolean;
  // Callbacks que tus nodos customizados podrían necesitar invocar:
  onPinToggle?: (nodeId: string) => void;
  onChangeNote?: (nodeId: string, newNote: string) => void;
  // setPanOnDrag es más global, pero si un nodo específico debe controlarlo, podría ir aquí.
  // setPanOnDrag?: (enabled: boolean) => void;
};

interface SearchBarProps {
    query: string;
    setQuery: React.Dispatch<React.SetStateAction<string>>;
    setNodes: React.Dispatch<React.SetStateAction<Node<NodePayload>[]>>;  // Aquí es donde debes usar el tipo correcto
    fetchNodes: (query: string) => Promise<Node<NodePayload>[]>;
}

export const SearchBar: React.FC<SearchBarProps> = ({ query, setQuery, setNodes, fetchNodes }) => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [results, setResults] = useState<Node[]>([]);
    const [noResults, setNoResults] = useState<boolean>(false);

    const handleSearch = async () => {
        setIsLoading(true);
        try {
            const fetchedNodes = await fetchNodes(query); // Obtener nodos coincidentes
            setNodes(fetchedNodes); // Actualizar ReactFlow con nodos filtrados
            setResults(fetchedNodes);
            setNoResults(fetchedNodes.length === 0);
        } catch (error) {
            console.error('Error en la búsqueda:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClearSearch = async () => {
        setQuery('');
        const allNodes = await fetchNodes(''); // Recargar todos los nodos
        setNodes(allNodes); // Restaurar ReactFlow a su estado inicial
        setResults([]);
        setNoResults(false);
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value);

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleSearch();
    };


    return (
        <div className="flex flex-col items-center justify-center mb-5 mt-5">
            <div className="relative w-80 h-12 text-gray-700">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Buscar por palabras clave"
                    className="w-full h-full px-4 py-2 pl-10 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#8A0602] focus:border-transparent shadow-sm transition-all duration-200 ease-in-out"
                />
                <FiSearch
                    onClick={handleSearch}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 cursor-pointer"
                />
                {query && (
                    <button
                        onClick={handleClearSearch}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 cursor-pointer"
                    >
                        ✕
                    </button>
                )}
            </div>
            {isLoading && (
                <div className="mt-2 text-sm text-gray-500">Cargando resultados...</div>
            )}
            {noResults && !isLoading && (
                <div className="mt-2 text-sm text-red-500">
                    No se encontraron resultados para "{query}"
                </div>
            )}
            {results.length > 0 && (
                <div className="mt-2 text-sm text-gray-500">
                    Se encontraron {results.length} resultados
                </div>
            )}
        </div>
    );
};
