import { useEffect } from 'react';
import { ReactFlowComponent } from './components/';
import { ReactFlowProvider } from '@xyflow/react';
import { NotesProvider } from './utils/NotesContext';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './views/LoginPage';
import PrivateRoute from './components/routes/PrivateRoute';
import { SupervisorComponent } from './components/SupervisorComponent';
import TabsComponent from './components/tabRender/tabComponent';  // Importa el nuevo componente de pestañas


const App = () => {

  useEffect(() => {
    const interval = setInterval(() => {
      fetch('https://gvhc-backend.onrender.com')
          .then(response => console.log('Manteniendo activo:', response))
          .catch(error => console.error('Error manteniendo activo:', error));
  }, 600000); // 10 minutos

    return () => clearInterval(interval)
  }, []);

  return (
    <NotesProvider>
        <ReactFlowProvider>
          <Router>
            <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<LoginPage />} />
                <Route
                      path="/dashboard"
                      element={
                          <PrivateRoute>
                            <TabsComponent/>
                          </PrivateRoute>
                    }
                />
                <Route
                      path="/supervisors"
                      element={
                          <PrivateRoute>
                            <SupervisorComponent/>
                          </PrivateRoute>
                    }
                />
            </Routes>
          </Router>
        </ReactFlowProvider>
    </NotesProvider>
  );
}

export default App;
