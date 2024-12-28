import { ReactFlowComponent } from './components/';
import logo from './assets/img/logo.png';
import { ReactFlowProvider } from '@xyflow/react';
import { NotesProvider } from './utils/NotesContext';

const App = () => {
  return (
    <NotesProvider>
    <ReactFlowProvider>
      <ReactFlowComponent/>
    </ReactFlowProvider>
    </NotesProvider>
  );
}

export default App;
