// src/components/hooks/PausedTime.tsx
import React, { useState, useEffect } from 'react';
import { FiClock } from 'react-icons/fi';
// Asegúrate de que la ruta sea correcta (cambié '../utils/helpers' a '../../utils/helpers' si estaba mal en tu copia)
import { formatTime, getElapsedSeconds } from '../utils/helpers'; 

interface PausedTimeProps {
    pauseStartTime: string;
}

const PausedTime: React.FC<PausedTimeProps> = ({ pauseStartTime }) => {
// Pasamos TRUE para isLocalTime para que lo interprete como hora local
const [elapsed, setElapsed] = useState(() => getElapsedSeconds(pauseStartTime, true));
    useEffect(() => {
            const intervalId = setInterval(() => {
                // Pasamos TRUE para isLocalTime en cada actualización también
                setElapsed(getElapsedSeconds(pauseStartTime, true));
            }, 1000);
        return () => clearInterval(intervalId);
        }, [pauseStartTime]);

    if (!pauseStartTime) {
    return null;
}
return (
    <p className="text-lg text-gray-400 flex items-center gap-1 mt-1">
        <FiClock className="text-orange-300" /> Paused for: {formatTime(elapsed)}
    </p>
);
};

export default PausedTime;