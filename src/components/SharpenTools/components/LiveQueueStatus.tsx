// src/components/realtime/LiveQueueStatus.tsx

import React from 'react';
import { useCallsWebSocket } from '../../../hooks/useCallWebSocket'; // Ajusta la ruta

const LiveQueueStatus: React.FC = () => {
    const { liveQueueStatus, isLoading, wsError } = useCallsWebSocket();

    if (isLoading) {
        return (
        <div className="flex items-center justify-center p-6 text-gray-600">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Cargando datos en tiempo real...
        </div>
        );
    }

    if (wsError) {
        return (
        <div className="flex items-center p-6 bg-red-100 border border-red-400 text-red-700 rounded-md">
            <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-12a1 1 0 102 0V7a1 1 0 10-2 0v-1zm1 7a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd"></path>
            </svg>
            Error del WebSocket: {wsError}
        </div>
        );
    }

    if (!liveQueueStatus || liveQueueStatus.length === 0) {
        return (
        <div className="p-6 text-center text-gray-500">
            No hay datos de estado de cola en vivo disponibles.
        </div>
        );
    }

    return (
        <div className="bg-white shadow-lg rounded-lg p-6 mb-8 w-full max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">Estado de Cola en Vivo</h2>
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
                <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre de Cola
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Llamadas
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Intervalo
                </th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {liveQueueStatus.map((item, index) => (
                <tr key={index}> {/* Usar un ID único si disponible, sino index es un fallback */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item["QueueName"] || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item["commType"] ?? 'N/A'} {/* Usar el alias que definiste */}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.intervals}
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
        <p className="mt-4 text-sm text-gray-500">
            Última actualización: {new Date().toLocaleTimeString()}
        </p>
        </div>
    );
};

export default LiveQueueStatus;