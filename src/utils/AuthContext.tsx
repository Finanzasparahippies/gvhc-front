// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode'; // Importa jwt-decode para decodificar el token de acceso
import API from '../utils/API'; // Asegúrate de que esta ruta sea correcta para tu instancia de Axios


    const AuthContext = createContext<AuthContextType | undefined>(undefined);

    interface AuthProviderProps {
    children: ReactNode;
    }

    export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<AuthContextType['user'] | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
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
            // Agrega otras propiedades del usuario si están en el token
        };
        return { user: userData, exp: decoded.exp };
        } catch (error) {
        console.error("Error decoding access token:", error);
        return null;
        }
    }, []);    
    
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

    const login = useCallback((accessToken: string, refreshToken: string, userData: AuthContextType['user']) => {
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
    },[]);

    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        setUser(null);
        setIsAuthenticated(false);
    };
    
    useEffect(() => {
        const rehydrateAuth = async () => {
            const storedAccessToken = localStorage.getItem('access_token');
            const storedRefreshToken = localStorage.getItem('refresh_token');

            if (storedAccessToken) {
                const decoded = decodeAccessToken(storedAccessToken);
                if (decoded && decoded.user) {
                const currentTime = Date.now() / 1000; // Tiempo actual en segundos UNIX

                if (decoded.exp > currentTime) {
                    // Token de acceso válido y no expirado
                    const storedUser = localStorage.getItem('user');
                    if (storedUser) {
                    try {
                        const userData = JSON.parse(storedUser);
                        setUser(userData);
                        setIsAuthenticated(true);
                    } catch (error) {
                        console.error("Error parsing stored user data:", error);
                        logout(); // Si no se puede parsear el usuario, considera la sesión inválida
                    }
                    } else {
                    // Esto no debería ocurrir si `login` siempre guarda el usuario
                    console.warn("Access token found but no user data in localStorage. Logging out.");
                    logout();
                    }
                } else if (storedRefreshToken) {
                    // Token de acceso expirado, intentar refrescarlo
                    console.log("Access token expired, attempting to refresh...");
                    try {
                    const response = await API.post<RefreshTokenResponse>('/api/token/refresh/', { refresh: storedRefreshToken });
                    const newAccessToken = response.data.refresh;
                    localStorage.setItem('access_token', newAccessToken);

                    // Decodificar el nuevo token para actualizar la info del usuario si es necesario
                    const newDecoded = decodeAccessToken(newAccessToken);
                    if (newDecoded && newDecoded.user) {
                        // Aquí, si tu `refresh_token` API devuelve un `user` actualizado, úsalo.
                        // Si solo devuelve un nuevo `access_token`, mantén el `user` original de localStorage
                        // o decodifícalo del nuevo token si contiene toda la info del user.
                        const storedUserAfterRefresh = localStorage.getItem('user');
                        if (storedUserAfterRefresh) {
                            const userData = JSON.parse(storedUserAfterRefresh);
                            setUser(userData); // Usa el usuario que ya tienes en localStorage
                            setIsAuthenticated(true);
                        } else {
                            // Si por alguna razón el usuario no está después del refresh, decodifica el nuevo token
                            setUser(newDecoded.user);
                            setIsAuthenticated(true);
                        }
                    } else {
                        console.error("Refreshed token is invalid or missing user data.");
                        logout();
                    }
                    } catch (error) {
                    console.error("Error refreshing token:", error);
                    logout(); // El refresh token también falló, cerrar sesión
                    }
                } else {
                    // No hay refresh token para un access token expirado
                    console.log("Access token expired and no refresh token found. Logging out.");
                    logout();
                }
                } else {
                // El token de acceso existe pero es inválido (no decodificable)
                console.warn("Invalid access token found. Logging out.");
                logout();
                }
            }
            setIsLoading(false); // La carga inicial ha terminado
            };

            rehydrateAuth();
        }, [decodeAccessToken, logout]); // Dependencias: decodeAccessToken y logout


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