import { ReactFlowComponent } from './components/';
import logo from './assets/img/logo.png';
import { ReactFlowProvider } from '@xyflow/react';
import { NotesProvider } from './utils/NotesContext';

const App = () => {
  return (
    <NotesProvider>
    <ReactFlowProvider>
      <div className="flex flex-row items-center justify-center">
        <div className="flex flex-col items-center text-center space-y-4">
          <img src={logo} alt="logo" className="w-[220px] h-[220px]" />
        </div>
      </div>
      <ReactFlowComponent/>
    </ReactFlowProvider>
    </NotesProvider>
  );
}

export default App;
