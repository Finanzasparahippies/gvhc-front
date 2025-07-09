// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import API from '../utils/API'; 

    const AuthContext = createContext<AuthContextType | undefined>(undefined);

    interface AuthProviderProps {
    children: ReactNode;
    }

    export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<AuthContextType['user']>(null);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true); // Nuevo estado de carga

    useEffect(() => {
    // Convertimos la lógica en una función asíncrona para usar await
    const validateToken = async () => {
        const accessToken = localStorage.getItem('access_token');

        if (!accessToken) {
            setIsLoading(false); // No hay token, termina la carga.
            return;
        }

        try {
            // ✨ CAMBIO CLAVE: Validar el token con el backend.
            // Usamos un endpoint protegido que devuelva los datos del usuario.
            // Si el token es inválido, esta llamada fallará y irá al catch.
            const response = await API.get<{data: User }>('api/protected/'); // O tu endpoint de perfil

            // Si la llamada tiene éxito, tenemos datos de usuario frescos.
            setUser(response.data.data);
        if (response.data) {
            const { id, username, role, email } = response.data.data;
            setUser({ id, username, role, email });
            } else {
                setUser(null); // En caso de que data venga vacía o nula
            }
        } catch (error) {
            console.error("La validación del token falló, cerrando sesión.", error);
            logout();
        } finally {
            setIsLoading(false);
        }
    };

    validateToken();
  }, []); // Se ejecuta solo una vez al montar

    const login = (accessToken: string, refreshToken: string, userData: AuthContextType['user']) => {
        if (!userData) {
            console.error("❌ login(): userData está vacío o no definido");
            return;
        }
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('refresh_token', refreshToken);
        localStorage.setItem('user', JSON.stringify(userData)); // Guarda el objeto de usuario completo
        setUser(userData);
        setIsAuthenticated(true);
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        setUser(null);
        setIsAuthenticated(false);
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, login, logout, isLoading }}>
        {children}
        </AuthContext.Provider>
    );
    };

    export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};