// src/components/hooks/ElapsedTime.tsx
import React, { useState, useEffect } from 'react';
import { FaClockRotateLeft } from "react-icons/fa6";
import { formatTime, getElapsedSeconds } from '../utils/helpers'

interface ElapsedTimeProps {
    startTime: string; // La fecha/hora de inicio en formato 'YYYY-MM-DD HH:mm:ss'
}

const ElapsedTime: React.FC<ElapsedTimeProps> = ({ startTime }) => {
    // NO PASAMOS 'true' para isLocalTime. Dejamos que use el comportamiento por defecto (UTC con 'Z' añadido).
    const [elapsedSeconds, setElapsedSeconds] = useState(() => getElapsedSeconds(startTime));

    useEffect(() => {
        const interval = setInterval(() => {
        setElapsedSeconds(getElapsedSeconds(startTime));
        }, 1000);

        return () => clearInterval(interval);
    }, [startTime]);

    return (
        <p className="text-sm text-purple-400 mt-2 flex items-center gap-2">
            <FaClockRotateLeft className='mr-2' /> Waiting Time: {formatTime(elapsedSeconds)}
        </p>
    );
};

export default ElapsedTime;