import { useState, ChangeEvent, KeyboardEvent } from 'react';
import { FiSearch } from 'react-icons/fi';
import { Node } from '@xyflow/react'

interface SearchBarProps {
    query: string;
    setQuery: (query: string) => void;
    setNodes: (nodes: Node[]) => void;
    fetchNodes: (query: string) => Promise<Node[]>;
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
