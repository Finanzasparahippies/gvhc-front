import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import '@xyflow/react/dist/style.css';


const rootElement = document.getElementById('root');

if ( rootElement ) {
  const root = createRoot( rootElement );
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
} else {
  console.error("No se encontro el elemento con id 'root'");
}



