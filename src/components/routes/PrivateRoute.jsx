import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import API from '../../utils/API'; // Asegúrate de que API incluye el token en los headers

const loadingMessages = [
    'Preparando la experiencia...🚀',
    'Verificando token...✨',
    'Cargando datos...✅', 
    'Listo en un momento...⚠️',
    'Solo un poquito más...⏰',
];

const PrivateRoute = ({ children }) => {
    
    const [isAuthenticated, setIsAuthenticated] = useState(null);
    const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

    const isLoading = ( ) => {
        return (
            <div className="flex flex-col items-center justify-center h-screen">
                <div className="flex items-center space-x-4 animate-pulse">
                    <svg
                    className="w-12 h-12 text-blue-500 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    >
                    <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                    ></circle>
                    <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                        ></path>
                    </svg>
                    <span className="text-xl font-semibold text-green-500">Cargando, por favor espera...</span>
                </div>
                {loadingMessages[loadingMessageIndex]}
            </div>
        )
    }
    
    useEffect(() => {
        const interval = setInterval(() => {
            setLoadingMessageIndex((prev) => (prev + 1) % loadingMessages.length);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const checkToken = async () => {
            const token = localStorage.getItem('access_token');
            if (!token) {
                setIsAuthenticated(false);
                return;
            }

            try {
                // Verifica el token en el endpoint protegido
                const response = await API.get('/protected/');
                if (response.status === 200) {
                    setIsAuthenticated(true);
                } else {
                    setIsAuthenticated(false);
                }
            } catch (err) {
                console.error('Error al verificar el token:', err);
                setIsAuthenticated(false);
            }
        };

        checkToken();
    }, []);

    if (isAuthenticated === null) {
        return (isLoading());
    }

    return isAuthenticated ? children : <Navigate to="/login" />;
};

export default PrivateRoute;
