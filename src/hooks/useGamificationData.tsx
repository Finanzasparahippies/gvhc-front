// src/components/hooks/useGamificationData.ts (Ejemplo de hook)
import { useState, useEffect } from 'react';
import API from '../utils/API'; // Tu instancia de Axios

interface AgentScore {
    id: number;
    username: string;
    gamification_points: number;
    gamification_level: number;
    // ... otras propiedades del usuario
}

interface LeaderboardResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: AgentScore[];
}

export const useGamificationData = () => {
    const [leaderboard, setLeaderboard] = useState<AgentScore[]>([]);
    const [myScore, setMyScore] = useState<AgentScore | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchGamification = async () => {
            try {
                // Fetch leaderboard
                const leaderboardRes = await API.get<LeaderboardResponse>('/api/users/leaderboard/');
                console.log("Leaderboard response:", leaderboardRes.data);
                setLeaderboard(leaderboardRes.data.results || []);

                // Fetch my score
                const myScoreRes = await API.get<AgentScore>('/api/users/my-score/');
                setMyScore(myScoreRes.data);

                setLoading(false);
            } catch (err) {
                console.error("Error fetching gamification data:", err);
                setError("Failed to load gamification data.");
                setLoading(false);
            }
        };

        fetchGamification();
        // Puedes añadir un setInterval aquí si no usas WebSockets para actualizaciones de gamificación
        // const interval = setInterval(fetchGamification, 60000); // Refrescar cada minuto
        // return () => clearInterval(interval);

    }, []);

    return { leaderboard, myScore, loading, error };
};