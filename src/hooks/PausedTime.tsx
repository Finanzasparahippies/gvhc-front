// src/components/hooks/PausedTime.tsx
import React, { useState, useEffect } from 'react';
import { FiClock } from 'react-icons/fi'; // Icono de reloj para la pausa
import { formatTime, getElapsedSeconds } from '../utils/helpers'; // Asegúrate de que la ruta sea correcta

interface PausedTimeProps {
    pauseStartTime: string; // La fecha/hora de inicio de la pausa
}

const PausedTime: React.FC<PausedTimeProps> = ({ pauseStartTime }) => {
    // Calcula el tiempo inicial transcurrido
    const [elapsed, setElapsed] = useState(() => getElapsedSeconds(pauseStartTime));

    useEffect(() => {
        // Configura un intervalo para actualizar cada segundo
        const intervalId = setInterval(() => {
            setElapsed(getElapsedSeconds(pauseStartTime));
        }, 1000);

        // Limpia el intervalo cuando el componente se desmonta o pauseStartTime cambia
        return () => clearInterval(intervalId);
    }, [pauseStartTime]); // Dependencia: re-ejecuta si pauseStartTime cambia

    if (!pauseStartTime) {
        return null; // No muestra nada si no hay un tiempo de pausa
    }

    return (
        <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
            <FiClock className="text-orange-300" /> Paused for: {formatTime(elapsed)}
        </p>
    );
};

export default PausedTime;