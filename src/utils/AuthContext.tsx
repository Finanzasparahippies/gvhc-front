// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode'; // Importa jwt-decode para decodificar el token de acceso
import API from '../utils/API'; // Asegúrate de que esta ruta sea correcta para tu instancia de Axios
import { AuthContextType, User, UserData } from '../types/declarations';


    const AuthContext = createContext<AuthContextType | undefined>(undefined);

    interface AuthProviderProps {
    children: ReactNode;
    }

    export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<AuthContextType['user'] | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true); // Nuevo estado de carga

    const login = useCallback(
        async (accessToken: string, refreshToken: string) => {
            localStorage.setItem('access_token', accessToken);
            localStorage.setItem('refresh_token', refreshToken);
            try {
                const response = await API.get<UserData>('api/users/protected/');
                setUser(response.data);
                localStorage.setItem('user', JSON.stringify(response.data));
            } catch (error) {
                console.error('Error fetching user data after login:', error);
                logout(); // Cerrar sesión si no se pueden obtener los datos
            }
            },
        [] 
    );


    const logout = useCallback(() => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        setUser(null);
        console.log("Would redirect to login here");
        window.location.pathname = '/login'
        // navigate('/login')
    },[]);
    
    useEffect(() => {
        const initializeAuth  = async () => {
            const accessToken = localStorage.getItem('access_token');
            const refreshToken = localStorage.getItem('refresh_token');
            if (!accessToken) {
                setUser(null);
                setIsLoading(false);
                console.log('Auth: No access token found. Not authenticated.');
                return;
            }

            try {
                // Primero, intenta validar el token de acceso actual con el backend.
                console.log("Auth: Attempting to validate access token with /api/protected/...");
                const response = await API.get<UserData>('api/users/protected/'); // O tu endpoint de perfil
                setUser(response.data);
                // Si la validación es exitosa, establece el usuario y termina la carga.
                localStorage.setItem('user', JSON.stringify(response.data));
                console.log('Auth: Validated user from access token.');

            } catch (error: any) {
                // Si la validación falla (ej. token expirado), intenta refrescarlo.
                console.warn("La validación del token de acceso falló. Intentando refrescar...");

                if (refreshToken) {
                    try {
                        const refreshResponse = await API.post<{ access: string }>('/api/token/refresh/', { refresh: refreshToken });
                        const newAccessToken = refreshResponse.data.access;
                        localStorage.setItem('access_token', newAccessToken);
                        console.log("Auth: Token refreshed successfully. Fetching user profile with new token...");

                        // ✨ Después de refrescar, vuelve a pedir los datos del usuario con el nuevo token.
                        const profileResponse = await API.get<UserData>('api/user/protected/');
                        setUser(profileResponse.data);
                        localStorage.setItem('user', JSON.stringify(profileResponse.data));
                        console.log('Auth: Token refreshed successfully and user profile fetched.');
                    } catch (refreshError) {
                        console.error("Auth: Failed to refresh token. Logging out.", refreshError);
                        setUser(null);
                        localStorage.removeItem('access_token');
                        localStorage.removeItem('refresh_token');
                        localStorage.removeItem('user');
                    }
                } else {
                     // 5. No hay refresh token, cierro sesión
                    console.log("Auth: No refresh token available. Logging out.");
                    setUser(null);
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    localStorage.removeItem('user');
                }
            } finally {
                setIsLoading(false);
                console.log('Auth: Initialization complete.');
            }
        };

        initializeAuth();
    }, [logout]); // Solo depende de `logout` (que está cacheado con useCallback)

    const contextValue = useMemo(() => ({
        user,
        isAuthenticated: !!user,
        login,
        logout,
        isLoading,
    }), [user, login, logout, isLoading]);

    return (
        <AuthContext.Provider value={contextValue}>
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