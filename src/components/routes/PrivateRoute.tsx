import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../utils/AuthContext'; // Ajusta la ruta si es necesario
import { PrivateRouteProps } from '../../types/declarations';


const loadingMessages = [
    'Preparando la experiencia...🚀',
    'Verificando token...✨',
    'Cargando datos...✅', 
    'Listo en un momento...⚠️',
    'Solo un poquito más...⏰',
];

const PrivateRoute:React.FC<PrivateRouteProps> = ({ children, requiredRoles }) => {
    
 
    const { user, isAuthenticated, isLoading  } = useAuth(); 
    const location = useLocation();


    if (isLoading) {
    // Si el AuthContext todavía está cargando el estado inicial del usuario,
    // mostramos un mensaje de carga.
    // Esto es crucial para evitar redirecciones prematuras.
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
          <span className="text-xl font-semibold text-green-500">Verificando sesión...</span>
        </div>
        <p className="mt-4 text-gray-600">Por favor, espera un momento.</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Si no está autenticado, redirige al login
    console.log("No autenticado, redirigiendo al login.");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 🟢 Lógica de verificación de roles
    if (requiredRoles && requiredRoles.length > 0) {
    // Los roles de Django son en minúsculas ('agent', 'supervisor', 'teamleader')
    // Los roles que pasas a requiredRoles son con mayúsculas ('Agent', 'Supervisor', 'Team Leader')
    // 🟢 Normaliza los roles para la comparación (por ejemplo, a minúsculas)
    const normalizedRequiredRoles = requiredRoles.map(role => role.toLowerCase());
    const userRoleLower = user?.role?.toLowerCase();

      if (!userRoleLower || !normalizedRequiredRoles.includes(userRoleLower)) {
      console.warn(`Acceso denegado. Rol del usuario: ${user?.role}. Roles requeridos: ${requiredRoles.join(', ')}`);
      // Opcional: limpiar la sesión si se accede a una ruta no permitida inesperadamente
      return <Navigate to="/dashboard" replace />; // O a una página de error 403
    }
  }
  return <>{children}</>; // Si está autenticado y tiene el rol correcto, renderiza los hijos
}



export default PrivateRoute;