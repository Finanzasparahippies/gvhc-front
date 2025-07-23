// src/utils/helpers.ts
export const getElapsedSeconds = (startTime: string): number => {
    if (!startTime) return 0;
    const isoTimeUTC = startTime.replace(' ', 'T') + 'Z';
    const start = new Date(isoTimeUTC).getTime();
    const now = Date.now();
    if (isNaN(start) || start > now) {
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