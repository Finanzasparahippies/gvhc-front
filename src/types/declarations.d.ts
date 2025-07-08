declare module '*.png' {
    const value: string;
    export default value;
}

interface PrivateRouteProps {
    children: ReactNode;
    requiredRoles: string[];
}

interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}


interface AuthContextType {
    user: { id: number | string; username: string; role: string; email: string } | null;
    isAuthenticated: boolean;
    login: (accessToken: string, refreshToken: string, userData: AuthContextType['user']) => void;
    logout: () => void;
    isLoading: boolean; // Para saber si estamos cargando el estado inicial del usuario
    }
interface User {
    id: number | string;
    username: string;
    role: string;
    email: string;
    first_name: string;
    last_name: string;
}

interface UserData {
    id: number | string;
    username: string;
    role: string;
    email: string;
    first_name: string;
    last_name: string;
    // Añade cualquier otro campo que UserSerializer esté incluyendo
}
