import { useState } from 'react';
import { ReactFlowComponent } from '../ReactFlowComponent';
import { TrainingComponent } from '../TrainingComponent';
import { SupervisorComponent } from '../SupervisorComponent';

type TabType = 'reactflow' | 'training' | 'supervisors';


const TabsComponent = () => {
  const [activeTab, setActiveTab] = useState<TabType>('reactflow'); // Estado para controlar la pestaña activa

  // Función para cambiar las pestañas
    const handleTabChange = (tab: TabType) => {
        setActiveTab(tab);
    };

    // Renderizar el contenido según la pestaña activa
    const renderTabContent = () => {
        switch (activeTab) {
        case 'reactflow':
            return <ReactFlowComponent />;
        case 'training':
            return <TrainingComponent />;
        case 'supervisors':
            return <SupervisorComponent />;
        default:
            return null;
        }
    };

    return (
        <div className="m-5">
        {/* Barra de pestañas */}
        <div className="absolute top-20">
            <button 
            onClick={() => handleTabChange('reactflow')}
            className={activeTab === 'reactflow' ? 'active px-2 bg-slate-200 border border-gray-400 cursor-pointer mr-3 rounded-md' : ''}
            >
            Protocols
            </button>
            <button 
            onClick={() => handleTabChange('training')}
            className={activeTab === 'training' ? 'active px-2 bg-slate-200 border border-gray-400 cursor-pointer mr-3 rounded-md' : ''}
            >
            Supervisors
            </button>
            <button 
            onClick={() => handleTabChange('supervisors')}
            className={activeTab === 'supervisors' ? 'active px-2 bg-slate-200 border border-gray-400 cursor-pointer mr-3 rounded-md' : ''}
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
