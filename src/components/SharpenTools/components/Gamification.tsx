// src/components/SharpenTools/components/QueuesDashboard.tsx (o un nuevo GamificationDashboard.tsx)
import React from 'react';
import { useGamificationData } from '../../../hooks/useGamificationData';

const GamificationDisplay: React.FC = () => {
    const { leaderboard, myScore, loading, error } = useGamificationData();

    if (loading) return <div>Cargando datos de gamificación...</div>;
    if (error) return <div className="text-red-500">Error: {error}</div>;

    return (
        <div className="gamification-container">
            {myScore && (
                <div className="my-score-card">
                    <h3>Mi Puntuación</h3>
                    <p>Puntos: {myScore.gamification_points}</p>
                    <p>Nivel: {myScore.gamification_level}</p>
                </div>
            )}

            <h3>Tabla de Clasificación</h3>
            <ol>
                {leaderboard.map((agent, index) => (
                    <li key={agent.id}>
                        {index + 1}. {agent.username} - Puntos: {agent.gamification_points} (Nivel: {agent.gamification_level})
                    </li>
                ))}
            </ol>
        </div>
    );
};

export default GamificationDisplay;