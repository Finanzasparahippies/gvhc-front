import React from 'react';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children }) => {

    const [isAuthenticated, setIsAuthenticated] = useState(null);

    useEffect(() => {
        const checkToken = async () => {
            try {
                await API.get('/some-protected-endpoint/');
                setIsAuthenticated(true);
            } catch (err) {
                setIsAuthenticated(false);
            }
        };

        checkToken();
    }, []);

    if (isAuthenticated === null) return <div>Loading...</div>;
    return isAuthenticated ? children : <Navigate to="/login" />;
};

export default PrivateRoute;
