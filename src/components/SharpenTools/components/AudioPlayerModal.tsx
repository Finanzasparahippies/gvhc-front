// src/components/AudioPlayerModal.tsx
import React from 'react';

interface AudioPlayerModalProps {
    isOpen: boolean;
    audioUrl: string | null;
    onClose: () => void;
}

const AudioPlayerModal: React.FC<AudioPlayerModalProps> = ({ isOpen, audioUrl, onClose }) => {
    if (!isOpen) return null; // No renderiza nada si no está abierto

    return (
        // Overlay semitransparente para el fondo
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            {/* Contenedor del modal */}
            <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg relative">
                {/* Botón de cerrar */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-gray-400 hover:text-gray-200 text-2xl"
                    title="Cerrar"
                >
                    &times;
                </button>

                <h2 className="text-xl font-bold text-white mb-4">Reproductor de Grabación</h2>

                {audioUrl ? (
                    // Reproductor de audio HTML5
                    <audio controls autoPlay className="w-full">
                        <source src={audioUrl} type="audio/wav" /> {/* Asumiendo .wav, ajusta si es necesario */}
                        <source src={audioUrl} type="audio/mpeg" /> {/* Soporte para .mp3 si aplica */}
                        Tu navegador no soporta el elemento de audio.
                    </audio>
                ) : (
                    <p className="text-gray-300">Cargando audio o URL no disponible...</p>
                )}

                <div className="mt-6 text-right">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AudioPlayerModal;