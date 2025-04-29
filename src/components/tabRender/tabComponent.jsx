import { useState } from 'react';
import { ReactFlowComponent } from '../ReactFlowComponent';
import { TrainingComponent } from '../TrainingComponent';

const TabsComponent = () => {
  const [activeTab, setActiveTab] = useState('reactflow'); // Estado para controlar la pestaña activa

  // Función para cambiar las pestañas
    const handleTabChange = (tab) => {
        setActiveTab(tab);
    };

    // Renderizar el contenido según la pestaña activa
    const renderTabContent = () => {
        switch (activeTab) {
        case 'reactflow':
            return <ReactFlowComponent />;
        case 'training':
            return <TrainingComponent />;
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
            React Flow
            </button>
            <button 
            onClick={() => handleTabChange('training')}
            className={activeTab === 'training' ? 'active px-2 bg-slate-200 border border-gray-400 cursor-pointer mr-3 rounded-md' : ''}
            >
            Supervisor
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
