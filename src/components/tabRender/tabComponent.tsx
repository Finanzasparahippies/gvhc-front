import { useEffect, useState } from 'react';
import { ReactFlowComponent } from '../ReactFlowComponent';
import { TrainingComponent } from '../TrainingComponent';
import { SupervisorComponent } from '../SupervisorComponent';
import { useAuth } from '../../utils/AuthContext'; // 🟢 Importa useAuth
import QueueDashboard from '../SharpenTools/components/QueuesDashboard';
import LiveQueueStatus from '../SharpenTools/components/LiveQueueStatus';
import  FoodStation  from '../foodStation/FoodStation';
import GamificationDisplay from '../SharpenTools/components/Gamification';

type TabType = 'reactflow' | 'training' | 'supervisors' | 'patientsQueues' | 'Food Station' | 'liveQueueStatus' | 'GVHC points';


const TabsComponent = () => {
  const [activeTab, setActiveTab] = useState<TabType>('reactflow'); // Estado para controlar la pestaña activa
  const { user, isLoading } = useAuth(); // 🟢 Obtén el objeto user y el estado de carga del contexto

    // console.log('TabsComponent RENDER - isLoading:', isLoading, 'user:', user?.username);

    useEffect(() => {
        console.log('TabsComponent: MOUNTED');
        return () => {
        console.log('TabsComponent: UNMOUNTED');
        };
    }, []); // Empty dependency array means this runs once on mount/unmount

    useEffect(() => {
        if (user?.role === 'egs') {
            setActiveTab('Food Station');
        }
    }, [user]); // Re-run when user or isLoading changes

    // Función para cambiar las pestañas
    const handleTabChange = (tab: TabType) => {
        // Prevent changing tabs if user is 'egs' and tries to navigate away from 'Food Station'
        if (user?.role === 'egs'  && tab !== 'Food Station') {
            console.warn("Acceso denegado: Los usuarios 'egs' solo pueden acceder a la estación de comida.");
            return;
        }

        if (tab === 'supervisors' && user?.role !== 'supervisor' && user?.role !== 'teamleader') {
            console.warn("Acceso denegado: Solo supervisores y team leaders pueden acceder a esta sección.");
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
        case 'Food Station':
            return <FoodStation />;
        case 'patientsQueues':
            return <QueueDashboard />;
        case 'GVHC points':
            return <GamificationDisplay />;
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
        case 'liveQueueStatus':
                // Opcional: Puedes añadir una comprobación de rol aquí también si la pestaña no es visible para todos
                // if (user?.role === 'supervisor' || user?.role === 'admin') {
                return <LiveQueueStatus />;
                // } else {
                //     return <p className="text-red-500 mt-4 text-center">Acceso no autorizado al estado de cola en vivo.</p>;
                // }
        default:
            return null;
        }
    };

    return (
        <div className="overflow-visible mx-auto">
        {/* Barra de pestañas */}
         {isLoading ? (
                    <div className="px-2 text-gray-500">Cargando...</div>
                
                ) : user?.role === 'egs' ? (
                    // If user is 'egs', only show Food Station button
                    <button
                        onClick={() => handleTabChange('Food Station')}
                        className={activeTab === 'Food Station' ? 'active px-2 bg-slate-200 border border-gray-400 cursor-pointer rounded-md' : 'text-white px-2'}
                    >
                        Food Station
                    </button>
                ) : (
                    // For all other roles, show standard buttons with existing conditions
                    <div className="relative top-20 ml-5 border border-gray-400 rounded-lg inline-flex items-center"> 
                        <button
                            onClick={() => handleTabChange('reactflow')}
                            className={activeTab === 'reactflow' ? 'active px-2 bg-slate-200 border border-gray-400 cursor-pointer mr-5 rounded-md' : 'mr-5 text-white px-2'}
                        >
                            Protocols
                        </button>
                        <button
                            onClick={() => handleTabChange('GVHC points')}
                            className={activeTab === 'GVHC points' ? 'active px-2 bg-slate-200 border border-gray-400 cursor-pointer mr-5 rounded-md' : 'mr-5 text-white px-2'}
                        >
                            GVHC points
                        </button>
                        <button
                            onClick={() => handleTabChange('training')}
                            className={activeTab === 'training' ? 'active px-2 bg-slate-200 border border-gray-400 cursor-pointer mr-5 rounded-md' : 'mr-5 text-white px-2'}
                        >
                            Trainees
                        </button>
                        {(user?.role === 'supervisor' || user?.role === 'teamleader') && (
                            <>
                                <button
                                    onClick={() => handleTabChange('supervisors')}
                                    className={activeTab === 'supervisors' ? 'active px-2 bg-slate-200 border border-gray-400 cursor-pointer rounded-md' : ' text-white px-2'}
                                >
                                    Supervisors
                                </button>
                                <button
                                    onClick={() => handleTabChange('liveQueueStatus')}
                                    className={activeTab === 'liveQueueStatus' ? 'active px-2 bg-slate-200 border border-gray-400 cursor-pointer rounded-md' : ' text-white px-2'}
                                >
                                    Live Queue Status
                                </button>
                            </>
                        )}
                        <button
                            onClick={() => handleTabChange('patientsQueues')}
                            className={activeTab === 'patientsQueues' ? 'active px-2 bg-slate-200 border border-gray-400 cursor-pointer rounded-md' : ' text-white px-2'}
                        >
                            Patients Queue's
                        </button>
                        {/* Always show Food Station for non-egs roles, if needed */}
                        <button
                            onClick={() => handleTabChange('Food Station')}
                            className={activeTab === 'Food Station' ? 'active px-2 bg-slate-200 border border-gray-400 cursor-pointer rounded-md' : ' text-white px-2'}
                        >
                            Food Station
                        </button>
                    </div>
                )}
        {/* Contenido de la pestaña activa */}
        <div className="tab-content">
            {renderTabContent()}
        </div>
        </div>
    );
};

export default TabsComponent;
