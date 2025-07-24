// src/utils/helpers.ts

export const getElapsedSeconds = (startTime: string, isLocalTime: boolean = false): number => {
    if (!startTime) return 0;

    let dateStringForParsing = startTime.replace(' ', 'T');

    // Si no es hora local, o si se especifica que es UTC (aunque tu string no tenga 'Z'
    // podríamos forzarlo si sabemos que es el comportamiento deseado para alguna fuente)
    // Para el caso de las colas, donde parecía funcionar con 'Z', lo volvemos a añadir.
    if (!isLocalTime) {
        // Asume que si no es "local", el servidor lo envía de tal forma que añadir 'Z' es correcto
        // para su interpretación como UTC por el Date constructor.
        // Esto cubre el caso original de ElapsedTime/LCW.
        dateStringForParsing += 'Z';
    }
    // console.log(`Parsing ${dateStringForParsing} with isLocalTime=${isLocalTime}`); // Para depuración

    const start = new Date(dateStringForParsing).getTime();
    const now = Date.now();

    if (isNaN(start) || start > now) {
        // console.warn('Invalid startTime or startTime is in the future:', startTime, 'Parsed as:', dateStringForParsing);
        return 0;
    }
    return Math.floor((now - start) / 1000);
};

export const formatTime = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};