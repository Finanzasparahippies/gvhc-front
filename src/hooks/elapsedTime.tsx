//  src/components/hooks/ElapsedTime.tsx
import React, { useState, useEffect } from 'react';
import { FaClockRotateLeft } from "react-icons/fa6";
import { formatTime, getElapsedSeconds } from '../utils/helpers'

interface ElapsedTimeProps {
  startTime: string; // La fecha/hora de inicio en formato 'YYYY-MM-DD HH:mm:ss'
}

const ElapsedTime: React.FC<ElapsedTimeProps> = ({ startTime }) => {
    // Convertir a un formato ISO válido para que Date() lo parsee consistentemente    
    const [elapsedSeconds, setElapsedSeconds] = useState(() => getElapsedSeconds(startTime));

    useEffect(() => {
        const interval = setInterval(() => {
            setElapsedSeconds(getElapsedSeconds(startTime));
        }, 1000);

        return () => clearInterval(interval);
    }, [startTime]); // La dependencia solo cambia si la llamada cambia

    return (
        <p className="text-sm text-purple-400 mt-2 flex items-center gap-2">
            <FaClockRotateLeft className='mr-2' /> Tiempo en espera: {formatTime(elapsedSeconds)}
        </p>
    );
};

export default ElapsedTime;