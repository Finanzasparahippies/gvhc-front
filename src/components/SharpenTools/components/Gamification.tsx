import React from 'react';
import { useGamificationData } from '../../../hooks/useGamificationData';

const GamificationDisplay: React.FC = () => {
  const { leaderboard, myScore, loading, error } = useGamificationData();

  if (loading)
    return (
      <div className="flex justify-center items-center h-64 text-gray-500 animate-pulse">
        Cargando datos de gamificación...
      </div>
    );

  if (error)
    return (
      <div className="text-red-500 text-center font-semibold">
        Error: {error}
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto p-5 my-5">
      {/* --- Mi puntuación --- */}
      {myScore && (
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl shadow-lg p-6 mb-8">
          <h3 className="text-2xl font-bold mb-2">🏅 Mi Puntuación</h3>
          <div className="flex flex-col sm:flex-row sm:justify-between text-lg">
            <p>
              <span className="font-semibold">Puntos:</span>{' '}
              {myScore.gamification_points ?? 0}
            </p>
            <p>
              <span className="font-semibold">Nivel:</span>{' '}
              {myScore.gamification_level ?? 'N/A'}
            </p>
          </div>
        </div>
      )}

      {/* --- Tabla de clasificación --- */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <h3 className="text-xl font-semibold text-gray-800 px-6 py-4 border-b">
          🏆 Tabla de Clasificación
        </h3>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Posición
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Puntos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nivel
                </th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-100">
              {leaderboard.map((agent, index) => (
                <tr
                  key={agent.id}
                  className={`hover:bg-indigo-50 ${
                    myScore?.id === agent.id ? 'bg-indigo-100 font-semibold' : ''
                  }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    #{index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {agent.username}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {agent.gamification_points ?? 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {agent.gamification_level ?? 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default GamificationDisplay;
