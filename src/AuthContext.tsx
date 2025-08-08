// src/AuthContent.tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './utils/AuthContext';
import LoginPage from './views/LoginPage';
import PrivateRoute from './components/routes/PrivateRoute';
import TabsComponent from './components/tabRender/tabComponent';
import { SupervisorComponent } from './components/SupervisorComponent';
import LoadingSpinner from './components/loadingSpinner/LoadingSpinner'; // Asegúrate de tener este componente

const AuthContent = () => {
    // Ahora, useAuth está correctamente dentro de su proveedor
    const { user, isLoading } = useAuth(); 

    if (isLoading) {
        return <LoadingSpinner />;
    }

    return (
        <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route
                path="/dashboard"
                element={
                    <PrivateRoute requiredRoles={['agent', 'supervisor', 'teamleader', 'egs']}>
                        <TabsComponent />
                    </PrivateRoute>
                }
            />
            <Route
                path="/supervisors"
                element={
                    <PrivateRoute requiredRoles={['supervisor', 'teamleader']}>
                        <SupervisorComponent />
                    </PrivateRoute>
                }
            />
        </Routes>
    );
};

export default AuthContent;