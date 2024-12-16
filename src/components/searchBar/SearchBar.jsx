import { useState } from 'react';
import { FiSearch } from 'react-icons/fi';

export const SearchBar = ({ query, setQuery, fetchNodes }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState([]);
    const [noResults, setNoResults] = useState(false);

    const handleSearch = () => {
        setIsLoading(true);
        fetchNodes(query)
            .then((results) => {
                setResults(results);
                setNoResults(results.length === 0);
                setIsLoading(false);
            })
            .catch((error) => {
                console.error('Error en la búsqueda:', error);
                setIsLoading(false);
            });
    };

    const handleClearSearch = () => {
        setQuery('');
        fetchNodes(''); // Vuelve a cargar todos los nodos
        setNoResults(false);
    };

    return (
        <div className="flex flex-col items-center justify-center">
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
