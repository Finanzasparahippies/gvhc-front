import { useState } from 'react';
import { ReactFlowComponent } from '../ReactFlowComponent';
import { TrainingComponent } from '../TrainingComponent';
import { SupervisorComponent } from '../SupervisorComponent';
import { useAuth } from '../../utils/AuthContext'; // 🟢 Importa useAuth

type TabType = 'reactflow' | 'training' | 'supervisors';


const TabsComponent = () => {
  const [activeTab, setActiveTab] = useState<TabType>('reactflow'); // Estado para controlar la pestaña activa
  const { user, isLoading } = useAuth(); // 🟢 Obtén el objeto user y el estado de carga del contexto


  // Función para cambiar las pestañas
    const handleTabChange = (tab: TabType) => {
        if (tab === 'supervisors' && user?.role !== 'supervisor' && user?.role !== 'teamleader') {
            console.warn("Acceso denegado: Solo supervisores y team leaders pueden acceder a esta sección.");
        // Opcional: Podrías mostrar un mensaje al usuario aquí (ej. un toast)
        return;
    }
        setActiveTab(tab);
    };

    // Renderizar el contenido según la pestaña activa
    const renderTabContent = () => {
        if (isLoading) {
           return <p>Cargando información del usuario...</p>; // O un spinner de carga
        }
        switch (activeTab) {
        case 'reactflow':
            return <ReactFlowComponent />;
        case 'training':
            return <TrainingComponent />;
        case 'supervisors':
        // 🟢 Solo renderiza SupervisorComponent si el rol es 'supervisor' o 'teamleader'
        if (user?.role === 'supervisor' || user?.role === 'teamleader') {
            return <SupervisorComponent />;
            } else {
            return <p className="text-red-500 mt-4 text-center">Acceso no autorizado a la sección de Supervisores.</p>;
            }
        default:
            return null;
        }
    };

    return (
        <div className="overflow-visible mx-auto">
        {/* Barra de pestañas */}
        <div className="relative top-20 ml-5">
            <button 
            onClick={() => handleTabChange('reactflow')}
            className={activeTab === 'reactflow' ? 'active px-2 bg-slate-200 border border-gray-400 cursor-pointer mr-5 rounded-md' : 'mr-5'}
            >
            Protocols
            </button>
            <button 
            onClick={() => handleTabChange('training')}
            className={activeTab === 'training' ? 'active px-2 bg-slate-200 border border-gray-400 cursor-pointer mr-5 rounded-md' : 'mr-5'}
            >
            Trainees
            </button>
            <button 
            onClick={() => handleTabChange('supervisors')}
            className={activeTab === 'supervisors' ? 'active px-2 bg-slate-200 border border-gray-400 cursor-pointer mr-5 rounded-md' : 'mr-5'}
            >
            Supervisors
            </button>
        </div>

        {/* Contenido de la pestaña activa */}
        <div className="tab-content">
            {renderTabContent()}
        </div>
        </div>
    );
};

export default TabsComponent;
