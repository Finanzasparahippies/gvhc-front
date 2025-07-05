// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

    const AuthContext = createContext<AuthContextType | undefined>(undefined);

    interface AuthProviderProps {
    children: ReactNode;
    }

    export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<AuthContextType['user']>(null);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true); // Nuevo estado de carga

    useEffect(() => {
        const loadUserFromStorage = () => {
        // Intenta cargar el usuario y los tokens del localStorage al iniciar la app
        const storedAccessToken = localStorage.getItem('access_token');
        const storedRefreshToken = localStorage.getItem('refresh_token');
        const storedUser = localStorage.getItem('user');

        if (storedAccessToken && storedRefreshToken && storedUser) {
        try {
            const userData = JSON.parse(storedUser);
            if (userData && typeof userData.role === 'string') {
                        setUser(userData);
                        setIsAuthenticated(true);
                    } else {
                        console.error("Stored user data is invalid or missing role:", userData);
                        logout(); // Limpiar si los datos son inválidos
                    }
        } catch (error) {
            console.error("Failed to parse stored user data:", error);
            logout(); // Limpiar si los datos son inválidos
        }
        }
        setIsLoading(false); // La carga inicial ha terminado
    };
    loadUserFromStorage();
    }, []); // Se ejecuta solo una vez al montar []);

    const login = (accessToken: string, refreshToken: string, userData: AuthContextType['user']) => {
        if (!userData) {
            console.error("❌ login(): userData está vacío o no definido");
            return;
        }
        console.log('data de usuario', userData)
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