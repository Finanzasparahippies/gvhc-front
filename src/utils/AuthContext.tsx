// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
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

    const decodeAccessToken = useCallback((token: string): { user: User, exp: number } | null => {
        try {
        const decoded: any = jwtDecode(token);
        // Asegúrate de que las propiedades del token coincidan con tu interfaz User
        const userData: User = {
            id: decoded.user_id || decoded.id, // Puede ser user_id o id dependiendo de tu JWT
            username: decoded.username || decoded.name, // Ajusta según tu token
            first_name: decoded.first_name,
            last_name: decoded.last_name,
            email: decoded.email,
            role: decoded.role, // ¡CRÍTICO! Asegúrate de que el rol esté en el token
            queues: decoded.queues
            // Agrega otras propiedades del usuario si están en el token
        };
        return { user: userData, exp: decoded.exp };
        } catch (error) {
        console.error("Error decoding access token:", error);
        return null;
        }
    }, []);    


    const login = useCallback((accessToken: string, refreshToken: string, userData: AuthContextType['user']) => {
        if (!userData) {
            console.error("❌ login(): userData está vacío o no definido");
            return;
        }
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('refresh_token', refreshToken);
        localStorage.setItem('user', JSON.stringify(userData)); // Guarda el objeto de usuario completo
        setUser(userData);
    },[]);

    const logout = useCallback(() => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        setUser(null);
        console.log("Would redirect to login here");
        // window.location.pathname = '/login'
    },[]);
    
    useEffect(() => {
        const initializeAuth  = async () => {
            const accessToken = localStorage.getItem('access_token');
            const refreshToken = localStorage.getItem('refresh_token');
            if (!accessToken) {
                setUser(null);
                setIsLoading(false);
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
    }, []); // Solo depende de `logout` (que está cacheado con useCallback)

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