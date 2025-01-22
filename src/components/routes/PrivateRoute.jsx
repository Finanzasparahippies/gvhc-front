import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import API from '../../utils/API'; // Asegúrate de que API incluye el token en los headers

const PrivateRoute = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(null);

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
        return <div>Loading...</div>; // Pantalla de carga mientras verifica
    }

    return isAuthenticated ? children : <Navigate to="/login" />;
};

export default PrivateRoute;
